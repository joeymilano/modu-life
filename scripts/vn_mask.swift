import Vision
import CoreImage
import ImageIO
import Foundation

// Cuts people out of the project's own story stills for the dialogue stage.
// Needs macOS 14+ (Vision subject masking) and Xcode command line tools.
//
//   swiftc -O scripts/vn_mask.swift -o /tmp/vn_mask
//   vn_mask list  [--person] <image>                  instances as id:widthxheight@x,y
//   vn_mask cut   [--person] <image> <out.png> <id>   one subject, transparent PNG
//   vn_mask mask  [--person] [--ids 1,2] <image> <out.png>
//                                                    union mask, white = subject
//
// --person separates each person; the default keeps whole salient subjects,
// which also carries things they are holding, such as a guitar.

func fail(_ text: String, _ code: Int32) -> Never {
	fputs(text + "\n", stderr)
	exit(code)
}

var argv = Array(CommandLine.arguments.dropFirst())
guard let command = argv.first else { fail("usage: vn_mask list|cut|mask [--person] [--ids 1,2] <image> …", 1) }
argv.removeFirst()
var person = false
if let i = argv.firstIndex(of: "--person") { person = true; argv.remove(at: i) }
var only: IndexSet?
if let i = argv.firstIndex(of: "--ids") {
	guard i + 1 < argv.count else { fail("--ids needs a list", 1) }
	only = IndexSet(argv[i + 1].split(separator: ",").compactMap { Int($0) })
	argv.removeSubrange(i...(i + 1))
}
guard let path = argv.first, let source = CGImageSourceCreateWithURL(URL(fileURLWithPath: path) as CFURL, nil),
      let cg = CGImageSourceCreateImageAtIndex(source, 0, nil) else { fail("cannot read \(argv.first ?? "")", 2) }
argv.removeFirst()

let image = CIImage(cgImage: cg)
let handler = VNImageRequestHandler(ciImage: image, options: [:])
var observation: VNInstanceMaskObservation?
do {
	if person { let r = VNGeneratePersonInstanceMaskRequest(); try handler.perform([r]); observation = r.results?.first }
	else { let r = VNGenerateForegroundInstanceMaskRequest(); try handler.perform([r]); observation = r.results?.first }
} catch { fail("vision failed: \(error)", 3) }
guard let observation = observation else { fail("no subject found", 4) }
let ids = observation.allInstances.sorted().filter { only?.contains($0) ?? true }
guard !ids.isEmpty else { fail("no instances", 5) }
let extent = image.extent

func alphaBounds(_ buffer: CVPixelBuffer) -> CGRect {
	CVPixelBufferLockBaseAddress(buffer, .readOnly)
	defer { CVPixelBufferUnlockBaseAddress(buffer, .readOnly) }
	let w = CVPixelBufferGetWidth(buffer), h = CVPixelBufferGetHeight(buffer), bpr = CVPixelBufferGetBytesPerRow(buffer)
	let p = CVPixelBufferGetBaseAddress(buffer)!.assumingMemoryBound(to: UInt8.self)
	var minX = w, minY = h, maxX = -1, maxY = -1
	for y in 0..<h { for x in 0..<w where p[y * bpr + x * 4 + 3] > 24 {
		if x < minX { minX = x }; if x > maxX { maxX = x }
		if y < minY { minY = y }; if y > maxY { maxY = y }
	} }
	if maxX < 0 { return .zero }
	return CGRect(x: CGFloat(minX), y: extent.height - CGFloat(maxY + 1), width: CGFloat(maxX - minX + 1), height: CGFloat(maxY - minY + 1))
}

func masked(_ id: Int) throws -> CVPixelBuffer {
	try observation.generateMaskedImage(ofInstances: IndexSet(integer: id), from: handler, croppedToInstancesExtent: false)
}

switch command {
case "list":
	var lines: [String] = []
	for id in ids {
		let box = alphaBounds(try masked(id))
		lines.append("\(id):\(Int(box.width))x\(Int(box.height))@x\(String(format: "%.2f", box.minX / extent.width)),y\(String(format: "%.2f", box.minY / extent.height))")
	}
	print(lines.joined(separator: " "))

case "cut":
	guard argv.count >= 2, let id = Int(argv[1]) else { fail("usage: vn_mask cut [--person] <image> <out.png> <id> [pad]", 1) }
	guard ids.contains(id) else { fail("no instance \(id)", 6) }
	let pad = argv.count > 2 ? Double(argv[2])! : 0.012
	let buffer = try masked(id)
	let box = alphaBounds(buffer)
	var out = CIImage(cvPixelBuffer: buffer)
	if let unpremultiply = CIFilter(name: "CIUnpremultiply") {
		unpremultiply.setValue(out, forKey: kCIInputImageKey)
		out = unpremultiply.outputImage!
	}
	let rect = CGRect(x: box.minX - pad * extent.width, y: box.minY - pad * extent.height,
	                  width: box.width + 2 * pad * extent.width, height: box.height + 2 * pad * extent.height).intersection(extent)
	let png = CIContext().pngRepresentation(of: out.cropped(to: rect), format: .RGBA8, colorSpace: CGColorSpace(name: CGColorSpace.sRGB)!)!
	try! png.write(to: URL(fileURLWithPath: argv[0]))
	print("cut \(id) \(Int(rect.width))x\(Int(rect.height))")

case "mask":
	guard argv.count >= 1 else { fail("usage: vn_mask mask [--person] [--ids 1,2] <image> <out.png>", 1) }
	let w = Int(extent.width), h = Int(extent.height)
	var pixels = [UInt8](repeating: 0, count: w * h)
	for id in ids {
		let buffer = try masked(id)
		CVPixelBufferLockBaseAddress(buffer, .readOnly)
		let bpr = CVPixelBufferGetBytesPerRow(buffer)
		let p = CVPixelBufferGetBaseAddress(buffer)!.assumingMemoryBound(to: UInt8.self)
		for y in 0..<h { for x in 0..<w { pixels[y * w + x] = max(pixels[y * w + x], p[y * bpr + x * 4 + 3]) } }
		CVPixelBufferUnlockBaseAddress(buffer, .readOnly)
	}
	let data = Data(pixels)
	let provider = CGDataProvider(data: data as CFData)!
	let gray = CGImage(width: w, height: h, bitsPerComponent: 8, bitsPerPixel: 8, bytesPerRow: w, space: CGColorSpaceCreateDeviceGray(),
	                   bitmapInfo: CGBitmapInfo(rawValue: CGImageAlphaInfo.none.rawValue), provider: provider, decode: nil, shouldInterpolate: false, intent: .defaultIntent)!
	let destination = CGImageDestinationCreateWithURL(URL(fileURLWithPath: argv[0]) as CFURL, "public.png" as CFString, 1, nil)!
	CGImageDestinationAddImage(destination, gray, nil)
	CGImageDestinationFinalize(destination)
	print("mask \(ids.count) instance(s)")

default:
	fail("unknown command \(command)", 1)
}

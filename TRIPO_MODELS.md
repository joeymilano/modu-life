# Tripo模型升级接口

外滩已实际导入一个已有 Tripo 模型：夜猫子邮筒。点击模型或地图标签会打开可旋转的3D特写与来信故事；选择消耗一格行动并进入存档。城市建筑目前仍为程序模型，不能将本次猫头鹰导入视为地标已替换。

原始素材是已有的 `owl+3d+model.zip`，并非本轮调用 API 新生成。保留原始顶点颜色，从1,988,579面精简到29,999面；发行GLB为721,448字节、无外部贴图或解码器依赖。来源、校验与制作记录位于 `public/models/tripo/provenance.json`。

玩家只加载静态GLB，不会调用Tripo服务，也不会接触API密钥。

## 已导入与可替换位置

| 模型槽 | 建议首批资产 | 目标高度 | 最大宽×深 |
| --- | --- | ---: | ---: |
| night-owl | 已导入：夜猫子邮筒 | 2.25 | 1.5×1.5 |
| oriental-pearl | 东方明珠微缩模型 | 12.2 | 3.2×3.2 |
| wukang-corner | 武康街角三角楼 | 6.5 | 6×4.6 |
| bund-facade | 外滩石材沿街立面 | 5.2 | 3.4×3.4 |
| jinmao | 金茂退台高楼 | 10.5 | 2.7×2.7 |
| shanghai-tower | 上海中心螺旋高楼 | 13.2 | 2.5×2.5 |
| financial-center | 环球金融中心开口楼 | 11.5 | 2.5×1.7 |
| zhangjiang-campus | 张江园区研发楼 | 5.2 | 3.4×3.9 |
| residential-block | 莘庄住宅楼模块 | 5.5 | 3.4×3.8 |

尺寸为游戏世界相对单位。渲染器通过模型包围盒自动居中、落地，并同时约束高度与占地；不会让模型无限放大挡住道路。

## 导入方式

1. 将审核后的GLB放进 `public/models/`，文件名可带版本，例如 `oriental-pearl-v1.glb`。
2. 在 `public/models/manifest.json` 中设置相应槽的 `url`，例如 `/models/oriental-pearl-v1.glb`。保留尺寸约束，必要时微调。
3. 启动游戏，分别检查白天、夜间、正面、角色行走和手机尺寸。
4. 加载失败时会回到原创程序化模型；测试失败和回退也应检查控制台与交互。

## 统一美术要求

用精致微缩城市语言：暖奶油石材、低饱和墨绿、赤陶屋顶、青绿玻璃。保留真实地标轮廓，细节按斜俯视远景阅读，不做写实脏污和强烈烘焙光照。模型自带材质需要能接受统一场景光照。

首批先替换东方明珠和武康街角，确认风格与性能再扩展。单个建筑优先控制在约5万三角形以内，纹理以1024或2048为主，GLB建议不超过2MB；这些是制作预算，不是自动验证结果。

## Tripo API v3 开发通道

已按当前官方 v3 接口准备 `scripts/tripo-assets.mjs`，配有东方明珠和武康街角两套制作提示词。只从环境或未跟踪的 `.env.local` 读取 `TRIPO_API_KEY`，不进入网页或GitHub。当前本地没有Key，尚未提交新的API生成任务。

```sh
node scripts/tripo-assets.mjs balance
node scripts/tripo-assets.mjs create oriental-pearl
node scripts/tripo-assets.mjs status oriental-pearl
node scripts/tripo-assets.mjs fetch oriental-pearl
```

只有 `create` 会提交一次计费生成；它保留任务ID，已有本地任务时拒绝重复提交。状态查询和下载不会偷偷重新生成。`fetch`只接受成功任务的自包含GLB，通过格式、大小和依赖检查后更新模型清单。导入后仍需查看真实轮廓、朝向、材质、昼夜与手机性能，不能把成功下载当成视觉验收。

当前通过Safari网页制作新资产，不使用API密钥。东方明珠已经生成，原始1,931,716面；武康大楼已经生成，原始1,923,802面。成年女性玩家模型已提交生成。三次生成各消耗55个现有积分，观察余额35。新模型仍被会员导出权限挡住，尚未下载或替换进游戏；用户准备自行开通导出权限，没有由本项目购买订阅。

参考图与生成提示词保存在 `art/model-references/`。参考图不代表已得到可用GLB；具体任务状态和导入范围应分别核实。任务ID保留在该目录说明中，继续下载时不要重新生成。

官方接口依据：[v3快速开始](https://developers.tripo3d.ai/en/docs/quick-start)、[P系列文生模型](https://developers.tripo3d.ai/en/docs/generation-text-to-model/p)。

## OBJ与GLB的网页优化

```sh
/Applications/Blender.app/Contents/MacOS/Blender -b --python scripts/prepare_tripo_model.py -- input.obj public/models/tripo/model-v1.glb 30000
```

输入也可以是 `.glb` 或 `.gltf`。脚本保留OBJ顶点色，或保留GLB材质与UV，减面并把大贴图缩到最长边1024像素，输出独立GLB与统计报告。只处理静态网格；人物骨骼和动画必须另行验证。

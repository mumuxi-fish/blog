# Godot 学习教材（第 1-8 课）

> 自学教材：从零开始学 Godot 4.7（你已安装，macOS 版）。
> 每课：概念讲解 + 操作步骤 + 预期效果 + 常见问题。
> 遇到问题随时问我。结合你的 Blender 基础（建模 → 导入 Godot 做游戏）效果最佳。
> 前置：会打开应用、会用鼠标键盘即可。

---

## 第 1 课：认识 Godot 界面 + 第一个项目

**目标**：打开 Godot，创建第一个 2D 项目，认识界面。

### 1.1 概念：Godot 是什么？

- **Godot** = 免费开源游戏引擎，用**节点（Node）**搭建游戏
- 游戏 = 一棵"节点树"：根节点 + 子节点（像文件夹套文件夹）
- 核心语言 **GDScript**：Godot 自己的 Python 风格脚本语言（简单好上手）

### 1.2 打开并创建项目

1. 打开 **Godot.app**（首次启动选语言，可切中文）
2. 项目管理器 → 点 **"新建项目（New）"**
3. 项目名：`my_first_game`；路径选个文件夹（如 `~/Documents/GodotProjects/`）
4. 渲染器选 **"兼容（Compatibility）"** 或默认 **"Forward+"**（2D 用兼容更稳）
5. 点 **"创建并编辑（Create & Edit）"**

### 1.3 认识界面（4 大区域）

| 区域 | 位置 | 作用 |
|------|------|------|
| **场景面板（Scene）** | 左 | 节点树，游戏的"骨架" |
| **3D/2D 视口（Viewport）** | 中 | 游戏画面，拖节点 |
| **检查器（Inspector）** | 右 | 选中节点的属性 |
| **输出/文件系统（FileSystem）** | 下/左下 | 项目文件 |

### 1.4 创建第一个节点

1. 场景面板点 **"+" 或右键** → 添加 **根节点（Root Node）** → 选 **"Node2D"**（2D 游戏根）
2. 节点出现，改名（`F2`）为 `Main`
3. **`Ctrl+S` 保存场景** → 命名 `main.tscn`

### 常见问题
- **没看到中文界面**：编辑器 → 编辑器设置 → 界面语言 → 中文
- **场景面板是空的**：先添加根节点（Node2D）

---

## 第 2 课：2D 角色 + 移动（键盘控制）

**目标**：做一个能上下左右移动的小方块 —— 第一次写游戏代码！

### 2.1 添加玩家节点

1. 场景里添加子节点：右键 `Main` → **添加子节点 → 字符（CharacterBody2D）**
   - CharacterBody2D = "会动的身体"，自带碰撞检测
2. 选中它 → 检查器改名 `Player`
3. 给 Player 加**子节点 → 图形 → 彩色矩形（ColorRect）** 或 **Polygon2D**
   - 简单做法：加 **ColorRect**，检查器里把大小改成 50×50，颜色改亮色
   - 或者用 **Sprite2D**（后面贴图用）

### 2.2 加碰撞（让物体有"实体"）

1. 选中 Player → 右键 → 添加子节点 → **碰撞形状（CollisionShape2D）**
2. 检查器 → **形状（Shape）→ 新建 → 矩形（RectangleShape2D）** → 大小 50×50

### 2.3 写移动代码（GDScript 初体验）

1. 选中 Player → 右键 → **附加脚本（Attach Script）** → 文件名默认 → 创建
2. 打开脚本编辑器，输入：

```gdscript
extends CharacterBody2D

var speed = 300  # 移动速度(像素/秒)

func _physics_process(delta):
    # 读取键盘输入(WASD 或 方向键)
    var direction = Input.get_vector("ui_left", "ui_right", "ui_up", "ui_down")
    # 移动 = 方向 × 速度
    velocity = direction * speed
    move_and_slide()
```

3. **`Ctrl+S` 保存脚本**

### 2.4 运行看效果

1. 点右上角 **▶ 运行（F6 运行当前场景）**
2. 游戏窗口弹出 → **按方向键/WASD** → 小方块移动！

### 常见问题
- **运行没反应**：确认 Player 选中状态按 F6；确认脚本是 `extends CharacterBody2D`
- **"ui_left" 没定义**：那是内置输入动作，默认就有，不用定义
- **方块不动**：检查 velocity 赋值 + move_and_slide()

---

## 第 3 课：碰撞 + 掉落 + 得分（做个小游戏）

**目标**：加上"从天上掉落的障碍物"，碰到就结束/得分 —— 完整小游戏雏形。

### 3.1 添加"掉落的球"场景（独立场景）

1. 新建场景：`Ctrl+N` → 根节点 **Area2D**（检测区域）→ 改名 `Ball` → 保存 `ball.tscn`
2. 给 Ball 加子节点：
   - **Polygon2D 或 ColorRect**（图形，画个圆/方块）
   - **CollisionShape2D**（碰撞，形状圆/矩形）
3. 给 Ball 附加脚本：

```gdscript
extends Area2D

var fall_speed = 200

func _physics_process(delta):
    position.y += fall_speed * delta  # 一直往下掉
    if position.y > 800:              # 掉出屏幕就删除
        queue_free()
```

### 3.2 把 Ball 放回主场景

1. 切回 `main.tscn`（点场景面板的 Main 标签）
2. 添加子节点 → **实例化子场景（Instance Child Scene）** → 选 `ball.tscn`
3. Ball 出现在场景里，拖到画面上方

### 3.3 定时生成球（用 Timer）

1. 主场景加子节点 → **计时器（Timer）**
2. 检查器：**等待时间（Wait Time）= 1** 秒，勾选 **自动启动（Autostart）**
3. 给 Timer 附加脚本，生成新球：

```gdscript
extends Timer

@onready var ball_scene = preload("res://ball.tscn")

func _on_timeout():
    var ball = ball_scene.instantiate()   # 造一个球
    ball.position = Vector2(randf() * 800, 0)  # 随机水平位置
    add_child(ball)                       # 放进场景
```

> `@onready var` 和 `func _on_timeout()` 用"连接信号"方式更简单：选中 Timer → 节点面板 → timeout 信号 → 连接 → 自动生成函数。

### 3.4 运行玩一玩

- F6 运行 → 球不断从上面掉下来，你的方块在下面躲！

### 常见问题
- **球不生成**：确认 Timer 自动启动勾选、timeout 信号连接对
- **球一下掉太快**：fall_speed 调小
- **画面比例**：项目设置 → 显示 → 窗口 → 视口大小改 800×600

---

## 第 4 课：GDScript 语法速成（游戏编程基础）

**目标**：不看教程也能写基础逻辑 —— 变量/函数/条件/信号。

### 4.1 变量

```gdscript
var score = 0          # 数字
var name = "玩家"       # 字符串
var is_alive = true    # 布尔
var speed = 5.0        # 小数
```

### 4.2 函数

```gdscript
func 名字(参数):
    return 返回值

func add(a, b):
    return a + b

print(add(2, 3))  # 输出 5
```

### 4.3 条件判断

```gdscript
if score >= 100:
    print("赢了！")
elif score >= 50:
    print("接近了")
else:
    print("继续努力")
```

### 4.4 信号（Signal）—— 节点之间通信

信号 = 节点"喊话"，别人可以"监听"。

```gdscript
# 例：Area2D 碰到东西时
func _on_body_entered(body):
    print("碰到了:", body.name)
```

### 4.5 常用内置函数

| 函数 | 作用 |
|------|------|
| `_ready()` | 场景加载时执行一次 |
| `_process(delta)` | 每帧执行（delta=帧间隔） |
| `_physics_process(delta)` | 物理帧执行（移动用这个） |
| `_on_body_entered(body)` | Area2D 碰到物体时 |

### 练习
写一个：分数变量 + 每帧加 1 + 到 100 打印"满分"。

---

## 第 5 课：3D 游戏入门 + 导入 Blender 模型

**目标**：开一个 3D 项目，把你 Blender 做的小人/怪兽放进游戏！两软件打通了。

### 5.1 新建 3D 项目

1. 项目管理器 → 新建项目 → 名称 `my_3d_game` → 创建
2. 场景面板加根节点 **Node3D** → 改名 `World`
3. 保存 `world.tscn`

### 5.2 从 Blender 导出模型（.glb 格式）

**在 Blender 里：**
1. 打开你做的小人/怪兽场景
2. 选中要导出的物体 → **文件 → 导出 → glTF 2.0（.glb）**
3. 命名 `monster.glb`，导出到 Godot 项目的文件夹（或之后拷进去）
   - 如果是多个物体，`Ctrl+J` 合并后导出，或勾选"所选物体"

### 5.3 导入 Godot

1. Godot 里打开 **文件系统面板** → 把 `monster.glb` **拖进项目文件夹**（或复制到项目目录后刷新）
2. Godot 自动导入，生成 `.glb` + `.import` 文件
3. 把 `monster.glb` **拖进 3D 视口** → 模型出现在场景里！

### 5.4 给模型加碰撞（能站地上）

1. 选中模型节点 → 右键 → 添加子节点 → **碰撞形状（CollisionShape3D）**
2. 形状选合适的（盒子/球/凸包）包裹住模型

### 5.5 加地面 + 光源

1. 添加子节点 → **静态体（StaticBody3D）** → 加 **MeshInstance3D**（图形 → 平面/盒子）当地面
2. 添加子节点 → **方向光（DirectionalLight3D）** 当太阳（检查器角度倾斜）
3. 加 **相机（Camera3D）** → 对准模型
4. F6 运行 → 看到你的 3D 模型！

### 常见问题
- **模型没出现**：确认导出的 .glb 在项目文件夹内；选中文件面板里的 glb 拖进视口
- **模型是黑色的**：Blender 里材质要在导出前检查；或加灯光
- **模型没碰撞**：手动加 CollisionShape3D

---

## 第 6 课：3D 角色控制（第一人称/第三人称）

**目标**：让模型能动起来 —— 第三人称控制 + 相机跟随。

### 6.1 建角色（CharacterBody3D）

1. 场景加根 Node3D → 改名 `Player`
2. Player 下加子节点：
   - **CollisionShape3D**（胶囊形状 Capsule，适合人形）
   - **模型**（你导入的 glb，拖到 Player 下当子节点）
   - **相机（Camera3D）**（当"眼睛"）

### 6.2 写移动脚本

```gdscript
extends CharacterBody3D

var speed = 5.0

func _physics_process(delta):
    var input = Vector2(
        Input.get_axis("ui_left", "ui_right"),
        Input.get_axis("ui_up", "ui_down")
    )
    var dir = Vector3(input.x, 0, input.y).normalized()
    velocity = dir * speed
    move_and_slide()
```

### 6.3 相机跟随（简单版）

给相机加脚本，每帧看向玩家：

```gdscript
# 挂在相机上
@export var target: Node3D

func _process(delta):
    if target:
        look_at(target.global_position, Vector3.UP)
```

把 target 拖入相机的 `target` 属性（检查器里拖玩家节点进去）。

### 6.4 运行

F6 运行 → WASD 控制小人移动，相机跟着他！

### 常见问题
- **走路方向不对**：dir 的 x/z 映射调整（x 左右、z 前后）
- **相机抖**：用 `_process` 平滑插值 `lerp` 位置

---

## 第 7 课：UI + 分数 + 游戏状态（HUD）

**目标**：加血条/分数/开始界面 —— 让游戏"完整"。

### 7.1 加 UI（CanvasLayer）

1. 主场景加子节点 → **CanvasLayer**（UI 专用层）→ 改名 `HUD`
2. HUD 下加 **Label**（文字）→ 检查器改文字 `分数: 0`、字号 32
3. 再拖一个 Label 当"游戏结束"提示（先隐藏：检查器勾掉可见 Visible）

### 7.2 脚本更新分数

```gdscript
# 挂在 HUD 或主控脚本
extends CanvasLayer

var score = 0
@onready var score_label = $ScoreLabel

func add_score(points):
    score += points
    score_label.text = "分数: " + str(score)
```

### 7.3 按钮（开始界面）

1. HUD 下加 **Button** → 文字改 `开始游戏`
2. 选中 Button → **节点面板 → pressed 信号 → 连接** → 写：

```gdscript
func _on_button_pressed():
    get_tree().change_scene_to_file("res://main.tscn")
```

### 常见问题
- **Label 看不到**：确认是 CanvasLayer 的子节点；字号调大
- **按钮点击没反应**：确认信号连接（pressed → 函数）

---

## 第 8 课：导出游戏（变成可玩的 App）

**目标**：把你的游戏导出成 macOS 可运行的程序。

### 8.1 配置导出

1. 菜单 → **项目（Project）→ 导出（Export）**
2. 点 **"添加（Add）"** → 选 **macOS**
3. 首次要下载导出模板（点提示里的"下载"）

### 8.2 导出

1. 点 **"导出项目（Export Project）"**
2. 选保存位置 → 生成 `.app` 文件
3. **双击 .app 就能玩**！可以发给朋友（同样系统才能跑）

### 8.3 导出小知识

- **不同平台要不同模板**：Windows（.exe）/ Linux / 网页（HTML5）
- 网页版导出最方便分享（上传到网站直接玩）
- 导出前最后运行一次，确认没问题

---

## 📌 教材总览

| 课 | 主题 | 状态 |
|----|------|------|
| 1 | 界面 + 第一个项目 | ⏳ |
| 2 | 2D 角色 + 键盘移动 | ⏳ |
| 3 | 碰撞 + 掉落 + 小游戏 | ⏳ |
| 4 | GDScript 语法速成 | ⏳ |
| 5 | 3D 游戏 + 导入 Blender 模型 | ⏳ |
| 6 | 3D 角色控制 + 相机跟随 | ⏳ |
| 7 | UI + 分数 + 游戏状态 | ⏳ |
| 8 | 导出游戏（App） | ⏳ |

---

## 🎓 学习路线建议

**路线 A（2D 快速入门）**：1 → 2 → 3 → 4 → 7 → 8
**路线 B（3D 结合 Blender）**：1 → 4 → 5 → 6 → 8
**完整版**：1-8 全学

> Blender + Godot 组合：Blender 建模做资产 → Godot 导入做游戏 —— 这是独立游戏开发者的经典工作流，你已经掌握一半了！

遇到任何问题，随时问我解答 💪

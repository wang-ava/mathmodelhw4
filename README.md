# Poisson 图像融合 - 数学建模作业 4

> 选项三：基于 Poisson 方程的图像编辑算法实现

[🌐 在线演示](https://wang-ava.github.io/mathmodelhw4/web/) |
[📄 实验报告](./report/option3_report.md) |
[📊 PDF 报告](./report/PB23061103王雨乾hw4.pdf)

---

## 项目简介

本项目实现了一个基于 Poisson 方程的图像融合（Poisson Image Editing）算法，提供交互式网页 GUI，支持：

- **Seamless Cloning**：无缝粘贴图像选区到目标图像
- **Mixing Gradients**：混合源图和目标图的梯度
- **Poisson 修复**：去除图像中的目标区域
- **纹理压平**：保留强边缘、抑制弱纹理

## 功能特性

### 核心功能
- Importing Gradients 的 Poisson 建模、稀疏方程求解和实现
- 交互式网页 GUI，支持绘制不规则遮罩、预设遮罩、拖动融合区域
- **实时拖动更新**，支持 WebM 录制
- 5 组测试图片（含人脸融合）
- 实时显示接缝跳变量

### 加分项
- Mixing gradients 与 Importing gradients 对比
- Poisson 修复（去除遮罩区域）
- Poisson 纹理压平（弱梯度抑制）

## 快速开始

### 在线演示
访问：[https://wang-ava.github.io/mathmodelhw4/web/](https://wang-ava.github.io/mathmodelhw4/web/)

### 本地运行

```bash
# 克隆仓库
git clone https://github.com/wang-ava/mathmodelhw4.git
cd mathmodelhw4

# 启动本地服务器
python3 -m http.server 8765

# 访问网页
open http://127.0.0.1:8765/web/index.html
```

### 自检模式
访问：[http://127.0.0.1:8765/web/index.html?selftest=1](http://127.0.0.1:8765/web/index.html?selftest=1)

### 自动录制
访问：[http://127.0.0.1:8765/web/index.html?recordDemo=1](http://127.0.0.1:8765/web/index.html?recordDemo=1)

## 算法原理

Poisson 方程源自物理学中的稳态热传导问题。通过最小化修正梯度场能量：

$$\min_v \int_{\Omega} |\nabla v - \nabla s|^2, \quad v|_{\partial\Omega} = t|_{\partial\Omega}$$

对应的 Euler-Lagrange 方程给出 Poisson 方程：

$$\Delta v = \Delta s \quad \text{in } \Omega$$

详细原理请参阅：[实验报告](./report/option3_report.md)

## 项目结构

```
mathmodelhw4/
├── web/                      # 网页 GUI（主入口）
│   ├── index.html           # Poisson 融合主页面
│   ├── faceswap.html        # 人脸融合页面
│   └── assets/              # 测试图像资源
├── poissonediting/           # MATLAB 原型实现
│   └── blendImagePoisson.m  # 核心融合算法
├── deliverables/            # 展示输出
│   ├── image_comparisons/   # 效果对比图
│   ├── case_results/        # 各 case 结果截图
│   └── poisson_interaction_demo.webm  # 交互演示视频
├── report/                  # 实验报告
│   ├── option3_report.md    # Markdown 原稿
│   └── PB23061103王雨乾hw4.pdf  # PDF 版本
└── README.md
```

## 实验结果

| 样例 | 遮罩像素 | 直接复制接缝 | Importing 接缝 | 降幅 |
|------|----------|--------------|----------------|------|
| Case 1: 海面物体到海岛 | 18,212 | 51.96 | 6.85 | 86.8% |
| Case 2: 花朵到织物 | 15,081 | 68.18 | 15.22 | 77.7% |
| Case 3: 霓虹标志到砖墙 | 16,350 | 88.05 | 11.69 | 86.7% |
| Case 4: 鱼到水面 | 20,376 | 39.92 | 7.60 | 81.0% |

## 演示脚本

1. 打开网页 GUI，选择默认样例
2. 拖动中央融合区域，观察实时求解和接缝跳变量显示
3. 观察底部三路对比：直接复制 vs Importing vs Mixing
4. 切换 4 组样例，展示不规则遮罩和不同场景的鲁棒性
5. 尝试 Poisson 修复和纹理压平功能
6. 点击"录制 WebM"或查看现成视频

## 技术实现

- **前端**：原生 JavaScript + Canvas API
- **数学求解**：SOR（逐次超松弛）迭代法
- **矩阵构造**：稀疏矩阵存储（节省 99%+ 内存）
- **实时交互**：拖动时 20-30 次迭代，松手后 100-200 次细化
- **视频录制**：MediaRecorder API

---

课程：26 数学建模
作者：王雨乾
学号：PB23061103

# Poisson 图像融合网页 GUI

运行方式：

```bash
cd /Users/avawang/Downloads/chrome/USTC_MM_26-master/hw_4
python3 -m http.server 8765
```

打开：

```text
http://127.0.0.1:8765/web/index.html
```

功能清单：

- Seamless cloning 的 Importing gradients 求解。
- Mixing gradients 对比。
- 至少 4 组测试图像，界面内可切换。
- 在结果画布中拖动融合区域，拖动时实时更新，松手后使用更高迭代次数细化。
- 使用 `MediaRecorder` 录制结果画布为 WebM。
- 加分应用：Poisson 修复/去除目标区域，使用零梯度场做调和插值。
- 扩展应用：Poisson 纹理压平，弱梯度置零、强边缘保留，可用“纹理阈值”调节。
- GUI 实时显示直接复制与当前结果的边界接缝跳变量。
- 自检输出：遮罩规模、求解耗时、直接复制/Importing/Mixing 的边界接缝跳变量。

自检入口：

```text
http://127.0.0.1:8765/web/index.html?selftest=1
```

自动录制入口：

```text
http://127.0.0.1:8765/web/index.html?recordDemo=1
```

\#交互式光线追踪代理模型演示器

本项目使用深度学习代理模型替代传统光线追踪计算，实现百倍速度提升，并构建了交互式Web应用进行对比演示。



&nbsp;##特性

\- 基于PyTorch训练的神经网络代理模型，输入光线参数 (Hx, Hy, Px, Py)，预测像平面落点 (X, Y)

\- 使用Optiland光学仿真库生成训练数据并作为基准对比

\- Flask后端提供REST API，支持单次预测和批量测试

\- 交互式Web界面，实时调整参数并可视化对比结果

\- 批量测试功能，自动生成随机光线，展示平均误差和速度提升



\## 技术栈

\- \*\*深度学习\*\*: PyTorch

\- \*\*光学仿真\*\*: Optiland

\- \*\*后端\*\*: Flask

\- \*\*前端\*\*: HTML, CSS, JavaScript, Chart.js

\- \*\*版本控制\*\*: Git



\##快速开始



&nbsp;###环境配置

```bash

pip install -r requirements.txt



启动应用

bash

python app.py

访问 http://127.0.0.1:5000



&nbsp;性能表现

平均误差: <0.1 mm

代理模型平均耗时: ~0.5 ms

解析模型平均耗时: ~55 ms

速度提升: 110倍



演示视频

\[点击观看演示视频(百度网盘)]

链接: https://pan.baidu.com/s/1DfC7bQ1evdbdxgNYZayQSQ?pwd=qjcv 提取码: qjcv 



&nbsp;项目结构

text

.

├── app.py                 # Flask主应用

├── ray\_tracer\_surrogate.pth  # 训练好的模型文件

├── Double\_Gauss\_Surrogate\_Model.ipynb  # Jupyter训练笔记本

├── static/                # 前端静态资源

├── templates/             # HTML模板

└── requirements.txt       # 依赖包列表（待生成）

本人的主要贡献

复现并调试了神经网络代理模型，使其适用于双高斯透镜系统。

构建了完整的Flask Web应用，实现实时交互和性能对比。

设计了批量测试功能，直观展示速度提升。

录制了演示视频。



&nbsp;项目说明与致谢

本项目是一个学习和展示性质的二次开发作品。

核心算法：基于网络上公开的教程/代码进行复现和改进（原项目来源已不可考）。

Web 界面：交互式前端由本人基于Flask和Chart.js开发。

演示视频：由本人录制。



若本项目涉及任何版权问题，或您认为侵犯了您的权益，请通过以下邮箱联系我，我将立即处理。

本项目不用于任何商业用途，仅作为技术展示。



&nbsp;联系方式：1113143201@qq.com

&nbsp;待办/改进

支持更多光学系统

部署到云端

添加误差分布直方图


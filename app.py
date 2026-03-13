import time
import numpy as np
import torch
import torch.nn as nn
from flask import Flask, request, jsonify, render_template
from optiland.samples.objectives import DoubleGauss

# --- 1. 定义神经网络 (从 notebook 复制) ---
class RayTracerSurrogate(nn.Module):
    def __init__(self):
        super(RayTracerSurrogate, self).__init__()
        self.fc = nn.Sequential(
            nn.Linear(4, 128), nn.ReLU(),
            nn.Linear(128, 128), nn.ReLU(),
            nn.Linear(128, 128), nn.ReLU(),
            nn.Linear(128, 2)
        )
    def forward(self, x):
        return self.fc(x)

# --- 2. 初始化 Flask 应用并加载模型 ---
app = Flask(__name__)

# 从 Optiland 加载透镜系统
lens = DoubleGauss()
MAX_IMG_HEIGHT = 24.72  # 与 notebook 中保持一致

# 加载预训练的 PyTorch 模型
device = torch.device('cpu') # 为简化部署，在 CPU 上运行
model = RayTracerSurrogate().to(device)
model.load_state_dict(torch.load('ray_tracer_surrogate.pth', map_location=device))
model.eval() # 切换到评估模式

# 归一化/反归一化辅助函数 (从 notebook 复制)
def normalize(x, max_val=MAX_IMG_HEIGHT):
    return x / max_val

def denormalize(x, max_val=MAX_IMG_HEIGHT):
    return x * max_val

# --- 3. 定义用于预测的 API 接口 ---
@app.route('/predict_ray', methods=['POST'])
def predict_ray():
    data = request.get_json()
    Hx, Hy, Px, Py = data['Hx'], data['Hy'], data['Px'], data['Py']

    # --- 代理模型预测 ---
    start_surrogate = time.perf_counter()
    inputs = torch.tensor([[Hx, Hy, Px, Py]], dtype=torch.float32).to(device)
    with torch.no_grad():
        predictions_normalized = model(inputs).cpu().numpy()[0]
    predictions = denormalize(predictions_normalized)
    time_surrogate = (time.perf_counter() - start_surrogate) * 1000 # 单位：毫秒

    # --- 解析模型 (Optiland) 预测作为真实值 ---
    start_analytical = time.perf_counter()
    wavelength = 0.5876
    rays_out = lens.trace_generic(np.array([Hx]), np.array([Hy]), np.array([Px]), np.array([Py]), np.array([wavelength]))
    analytical_result = np.array([rays_out.x[0], rays_out.y[0]])
    time_analytical = (time.perf_counter() - start_analytical) * 1000 # 单位：毫秒

    # --- 准备并发送响应 ---
    response = {
        "surrogate_coords": {"x": float(predictions[0]), "y": float(predictions[1])},
        "analytical_coords": {"x": float(analytical_result[0]), "y": float(analytical_result[1])},
        "time_surrogate": time_surrogate,
        "time_analytical": time_analytical,
        "error": float(np.linalg.norm(predictions - analytical_result))
    }
    return jsonify(response)

# --- 4. 渲染主 HTML 页面 ---
@app.route('/')
def home():
    return render_template('index.html')

if __name__ == '__main__':
    app.run(debug=True)
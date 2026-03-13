document.addEventListener('DOMContentLoaded', function () {
    const sliders = {
        hx: document.getElementById('hx'),
        hy: document.getElementById('hy'),
        px: document.getElementById('px'),
        py: document.getElementById('py'),
    };

    const traceBtn = document.getElementById('trace-btn');
    const loader = document.getElementById('loader');
    const batchTestBtn = document.getElementById('batch-test-btn');

    // 更新滑动条旁边的数值显示
    for (const key in sliders) {
        const valSpan = document.getElementById(`${key}-val`);
        sliders[key].addEventListener('input', () => {
            valSpan.textContent = sliders[key].value;
        });
    }

    // Chart.js 初始化设置 - 修复版本
    const ctx = document.getElementById('resultChart').getContext('2d');
    const resultChart = new Chart(ctx, {
        type: 'scatter',
        data: {
            datasets: [
                {
                    label: '代理模型 (NN)',
                    data: [],
                    backgroundColor: 'rgba(255, 99, 132, 1)',
                    pointRadius: 8,
                    pointStyle: 'circle'
                },
                {
                    label: '解析模型 (Optiland)',
                    data: [],
                    backgroundColor: 'rgba(54, 162, 235, 1)',
                    pointRadius: 10,
                    pointStyle: 'cross',
                    borderColor: 'rgba(54, 162, 235, 1)',
                    borderWidth: 2
                }
            ]
        },
        options: {
            scales: {
                x: { 
                    title: { display: true, text: 'X (mm)' }, 
                    min: -25, 
                    max: 25,
                    grid: { color: 'rgba(0,0,0,0.1)' }
                },
                y: { 
                    title: { display: true, text: 'Y (mm)' }, 
                    min: -25, 
                    max: 25,
                    grid: { color: 'rgba(0,0,0,0.1)' }
                }
            },
            aspectRatio: 1,
            plugins: { 
                legend: { 
                    position: 'bottom',
                    labels: {
                        usePointStyle: true,
                        padding: 20
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return `${context.dataset.label}: (${context.parsed.x.toFixed(3)}, ${context.parsed.y.toFixed(3)})`;
                        }
                    }
                }
            }
        }
    });

    // 更新界面结果的函数 - 修复版本
    function updateResults(data) {
        console.log("📊 收到数据:", data);

        // 更新表格数据
        document.getElementById('surrogate-coords').textContent = `(${data.surrogate_coords.x.toFixed(3)}, ${data.surrogate_coords.y.toFixed(3)})`;
        document.getElementById('analytical-coords').textContent = `(${data.analytical_coords.x.toFixed(3)}, ${data.analytical_coords.y.toFixed(3)})`;
        document.getElementById('surrogate-time').textContent = data.time_surrogate.toFixed(3);
        document.getElementById('analytical-time').textContent = data.time_analytical.toFixed(3);
        document.getElementById('error-val').textContent = data.error.toFixed(5);
        document.getElementById('speedup-val').textContent = (data.time_analytical / data.time_surrogate).toFixed(1);

        // 修复图表数据更新 - 确保两个点都显示
        console.log("🔄 更新图表数据...");

        // 方法1：直接设置数据数组
        resultChart.data.datasets[0].data = [{
            x: data.surrogate_coords.x,
            y: data.surrogate_coords.y
        }];

        resultChart.data.datasets[1].data = [{
            x: data.analytical_coords.x,
            y: data.analytical_coords.y
        }];

        console.log("代理数据集:", resultChart.data.datasets[0].data);
        console.log("解析数据集:", resultChart.data.datasets[1].data);

        // 强制更新图表
        resultChart.update();
        console.log("✅ 图表更新完成");

        // 验证图表状态
        setTimeout(() => {
            console.log("图表最终状态:");
            console.log("数据集0点数:", resultChart.data.datasets[0].data.length);
            console.log("数据集1点数:", resultChart.data.datasets[1].data.length);
        }, 100);
    }

    // 为追踪按钮添加点击事件监听
    traceBtn.addEventListener('click', async () => {
        console.log("🎯 点击追踪光线按钮");
        loader.style.display = 'block';
        traceBtn.disabled = true;

        const payload = {
            Hx: parseFloat(sliders.hx.value),
            Hy: parseFloat(sliders.hy.value),
            Px: parseFloat(sliders.px.value),
            Py: parseFloat(sliders.py.value),
        };

        console.log("发送请求数据:", payload);

        try {
            const response = await fetch('/predict_ray', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            console.log("✅ 收到响应:", data);
            updateResults(data);

        } catch (error) {
            console.error('❌ 错误:', error);
            alert('发生错误，请查看控制台。');
        } finally {
            loader.style.display = 'none';
            traceBtn.disabled = false;
        }
    });

    // ========== 批量测试系统 ==========
    // 批量测试相关变量
    let cancelTest = false;
    let testStartTime = null;

    // 更新批量测试按钮文本
    function updateBatchButtonText(count) {
        document.getElementById('batch-test-btn').textContent = `批量测试 (${count}条)`;
    }

    // 显示进度条
    function showProgressBar() {
        const progressBar = document.getElementById('progress-bar');
        if (progressBar) {
            progressBar.style.display = 'block';
            document.getElementById('progress-fill').style.width = '0%';
            document.getElementById('progress-percent').textContent = '0%';
            document.getElementById('progress-text').textContent = '准备中...';
            document.getElementById('time-estimate').textContent = '';
        }
    }

    // 隐藏进度条
    function hideProgressBar() {
        const progressBar = document.getElementById('progress-bar');
        if (progressBar) {
            progressBar.style.display = 'none';
        }
    }

    // 更新进度
    function updateProgress(current, total, estimatedTimeRemaining) {
        const progress = (current / total) * 100;
        const progressFill = document.getElementById('progress-fill');
        const progressPercent = document.getElementById('progress-percent');
        const progressText = document.getElementById('progress-text');

        if (progressFill && progressPercent && progressText) {
            progressFill.style.width = `${progress}%`;
            progressPercent.textContent = `${progress.toFixed(1)}%`;
            progressText.textContent = `已测试: ${current}/${total}`;

            if (estimatedTimeRemaining) {
                document.getElementById('time-estimate').textContent = 
                    `预计剩余: ${estimatedTimeRemaining}秒`;
            }
        }
    }

    // 估算剩余时间
    function estimateRemainingTime(startTime, completed, total) {
        if (completed === 0) return null;

        const elapsed = (Date.now() - startTime) / 1000; // 秒
        const timePerTest = elapsed / completed;
        const remainingTests = total - completed;
        const estimatedRemaining = timePerTest * remainingTests;

        return Math.ceil(estimatedRemaining);
    }

    // 快速选项点击事件
    document.querySelectorAll('.quick-option').forEach(option => {
        option.addEventListener('click', function() {
            const count = parseInt(this.getAttribute('data-count'));
            document.getElementById('batch-count').value = count;
            updateBatchButtonText(count);
        });
    });

    // 批量测试数量输入变化
    document.getElementById('batch-count').addEventListener('input', function() {
        let value = parseInt(this.value);
        if (isNaN(value) || value < 1) {
            this.value = 1;
        } else if (value > 500) {
            this.value = 500;
        }
        updateBatchButtonText(this.value);
    });

    // 取消测试功能
    document.getElementById('cancel-test-btn').addEventListener('click', function() {
        cancelTest = true;
        this.style.display = 'none';
    });

    // 批量测试功能
    batchTestBtn.addEventListener('click', async function() {
        if (this.dataset.testing === 'true') {
            return; // 防止重复点击
        }

        const btn = this;
        const cancelBtn = document.getElementById('cancel-test-btn');
        const originalText = btn.textContent;

        // 获取用户输入的光线数量
        const batchCountInput = document.getElementById('batch-count');
        let totalTests = parseInt(batchCountInput.value);

        // 验证输入范围
        if (isNaN(totalTests) || totalTests < 1) {
            totalTests = 20;
            batchCountInput.value = 20;
        } else if (totalTests > 500) {
            totalTests = 500;
            batchCountInput.value = 500;
        }

        // 重置取消标志
        cancelTest = false;
        testStartTime = Date.now();

        // 更新UI状态
        btn.dataset.testing = 'true';
        btn.disabled = true;
        btn.textContent = `测试中... (0/${totalTests})`;
        if (cancelBtn) cancelBtn.style.display = 'inline-block';
        loader.style.display = 'block';
        showProgressBar();

        const originalRay = {
            Hx: parseFloat(sliders.hx.value),
            Hy: parseFloat(sliders.hy.value),
            Px: parseFloat(sliders.px.value),
            Py: parseFloat(sliders.py.value),
        };

        const surrogatePoints = [];
        const analyticalPoints = [];
        let totalError = 0;
        let totalSurrogateTime = 0;
        let totalAnalyticalTime = 0;
        let completedTests = 0;
        let successfulTests = 0;

        try {
            for (let i = 0; i < totalTests; i++) {
                // 检查是否取消
                if (cancelTest) {
                    console.log('用户取消了测试');
                    break;
                }

                const randomRay = {
                    Hx: (Math.random() - 0.5) * 2,
                    Hy: (Math.random() - 0.5) * 2,
                    Px: (Math.random() - 0.5) * 2,
                    Py: (Math.random() - 0.5) * 2,
                };

                try {
                    const response = await fetch('/predict_ray', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(randomRay)
                    });

                    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

                    const data = await response.json();

                    surrogatePoints.push({
                        x: data.surrogate_coords.x,
                        y: data.surrogate_coords.y
                    });
                    analyticalPoints.push({
                        x: data.analytical_coords.x,
                        y: data.analytical_coords.y
                    });

                    totalError += data.error;
                    totalSurrogateTime += data.time_surrogate;
                    totalAnalyticalTime += data.time_analytical;
                    completedTests++;
                    successfulTests++;

                    // 更新进度
                    const estimatedTimeRemaining = estimateRemainingTime(testStartTime, completedTests, totalTests);
                    updateProgress(completedTests, totalTests, estimatedTimeRemaining);
                    btn.textContent = `测试中... (${completedTests}/${totalTests})`;

                } catch (error) {
                    console.error(`第 ${i + 1} 次测试错误:`, error);
                    completedTests++; // 仍然计数，但不算成功
                    // 更新进度但不计入成功测试
                    const estimatedTimeRemaining = estimateRemainingTime(testStartTime, completedTests, totalTests);
                    updateProgress(completedTests, totalTests, estimatedTimeRemaining);
                    btn.textContent = `测试中... (${completedTests}/${totalTests})`;
                }

                // 根据测试数量调整延迟，大规模测试时减少延迟
                const delay = totalTests > 100 ? 10 : 30;
                await new Promise(resolve => setTimeout(resolve, delay));
            }

            // 恢复原始光线参数
            if (!cancelTest && successfulTests > 0) {
                sliders.hx.value = originalRay.Hx;
                sliders.hy.value = originalRay.Hy;
                sliders.px.value = originalRay.Px;
                sliders.py.value = originalRay.Py;

                document.getElementById('hx-val').textContent = originalRay.Hx.toFixed(2);
                document.getElementById('hy-val').textContent = originalRay.Hy.toFixed(2);
                document.getElementById('px-val').textContent = originalRay.Px.toFixed(2);
                document.getElementById('py-val').textContent = originalRay.Py.toFixed(2);

                // 计算平均值（仅基于成功测试）
                const avgError = totalError / successfulTests;
                const avgSurrogateTime = totalSurrogateTime / successfulTests;
                const avgAnalyticalTime = totalAnalyticalTime / successfulTests;
                const avgSpeedup = avgAnalyticalTime / avgSurrogateTime;

                // 更新界面显示批量测试结果
                document.getElementById('surrogate-coords').textContent = `批量测试 (${successfulTests}条)`;
                document.getElementById('analytical-coords').textContent = `批量测试 (${successfulTests}条)`;
                document.getElementById('surrogate-time').textContent = avgSurrogateTime.toFixed(3);
                document.getElementById('analytical-time').textContent = avgAnalyticalTime.toFixed(3);
                document.getElementById('error-val').textContent = avgError.toFixed(5);
                document.getElementById('speedup-val').textContent = avgSpeedup.toFixed(1);

                // 更新图表显示所有测试点
                resultChart.data.datasets[0].data = surrogatePoints;
                resultChart.data.datasets[1].data = analyticalPoints;
                resultChart.update();
            }

        } finally {
            // 恢复UI状态
            btn.dataset.testing = 'false';
            btn.disabled = false;
            updateBatchButtonText(batchCountInput.value);
            if (cancelBtn) cancelBtn.style.display = 'none';
            loader.style.display = 'none';
            hideProgressBar();

            const finalStatus = cancelTest ? '已取消' : '完成';
            console.log(`批量测试${finalStatus}! 成功测试了 ${successfulTests} 条光线`);

            if (cancelTest) {
                alert(`测试已取消。已完成 ${completedTests}/${totalTests} 条光线测试。`);
            }
        }
    });

    // 页面加载时初始化批量测试按钮文本
    const batchCount = document.getElementById('batch-count').value;
    updateBatchButtonText(batchCount);

    // 页面加载时自动追踪一次
    console.log("🚀 页面加载完成，自动追踪一次");
    traceBtn.click();
});
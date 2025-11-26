import { ChartDataPoint, TimeSeriesData, ChartConfig } from '../../../shared/types/index.js';

export class ChartUIGenerator {
  /**
   * Generate HTML for Chart.js visualization
   */
  static generateChartHTML(config: ChartConfig): string {
    const chartId = `chart-${Math.random().toString(36).substr(2, 9)}`;
    const { type, title, data, options = {} } = config;

    // Prepare data based on chart type
    let labels: string[];
    let values: number[];
    let datasets: any[];

    if (this.isTimeSeriesData(data)) {
      labels = data.map((d: TimeSeriesData) => d.date);
      values = data.map((d: TimeSeriesData) => d.value);
      datasets = [{
        label: title,
        data: values,
        backgroundColor: this.getChartColors(type, values.length),
        borderColor: type === 'line' || type === 'area' ? 'rgb(75, 192, 192)' : undefined,
        borderWidth: type === 'line' || type === 'area' ? 2 : 1,
        fill: type === 'area' ? true : false,
        tension: type === 'line' || type === 'area' ? 0.4 : undefined
      }];
    } else {
      const chartData = data as ChartDataPoint[];
      labels = chartData.map(d => d.label);
      values = chartData.map(d => d.value);
      const colors = chartData.map(d => d.color) || this.getChartColors(type, values.length);

      datasets = [{
        label: title,
        data: values,
        backgroundColor: colors,
        borderColor: type === 'line' ? colors[0] : undefined,
        borderWidth: type === 'line' ? 2 : 1
      }];
    }

    const chartConfig = {
      type: type === 'area' ? 'line' : type,
      data: {
        labels,
        datasets
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: options.showLegend !== false,
            position: 'top' as const
          },
          title: {
            display: true,
            text: title,
            font: {
              size: 16,
              weight: 'bold' as const
            }
          }
        },
        scales: type !== 'pie' && type !== 'doughnut' ? {
          y: {
            beginAtZero: true,
            grid: {
              display: options.showGrid !== false
            }
          },
          x: {
            grid: {
              display: options.showGrid !== false
            }
          }
        } : undefined
      }
    };

    return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js"></script>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
      padding: 20px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      min-height: 100vh;
    }
    .container {
      max-width: 900px;
      margin: 0 auto;
      background: white;
      border-radius: 12px;
      box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
      padding: 30px;
    }
    .chart-container {
      position: relative;
      height: 400px;
      margin-top: 20px;
    }
    .stats {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
      gap: 15px;
      margin-top: 20px;
      padding-top: 20px;
      border-top: 2px solid #e2e8f0;
    }
    .stat-card {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 15px;
      border-radius: 8px;
      text-align: center;
    }
    .stat-label {
      font-size: 12px;
      opacity: 0.9;
      margin-bottom: 5px;
    }
    .stat-value {
      font-size: 24px;
      font-weight: bold;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="chart-container">
      <canvas id="${chartId}"></canvas>
    </div>
    <div class="stats" id="stats"></div>
  </div>

  <script>
    const ctx = document.getElementById('${chartId}').getContext('2d');
    const config = ${JSON.stringify(chartConfig)};
    new Chart(ctx, config);

    // Calculate and display statistics
    const values = ${JSON.stringify(values)};
    const total = values.reduce((a, b) => a + b, 0);
    const average = total / values.length;
    const max = Math.max(...values);
    const min = Math.min(...values);

    const statsHTML = \`
      <div class="stat-card">
        <div class="stat-label">Total</div>
        <div class="stat-value">\${total.toLocaleString()}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Average</div>
        <div class="stat-value">\${Math.round(average).toLocaleString()}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Maximum</div>
        <div class="stat-value">\${max.toLocaleString()}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Minimum</div>
        <div class="stat-value">\${min.toLocaleString()}</div>
      </div>
    \`;

    document.getElementById('stats').innerHTML = statsHTML;
  </script>
</body>
</html>
    `.trim();
  }

  /**
   * Generate HTML for a dashboard with multiple charts
   */
  static generateDashboardHTML(charts: ChartConfig[], title: string = 'Dashboard'): string {
    const chartsHTML = charts.map((chart, index) => {
      const chartId = `chart-${index}`;
      const { type, data, options = {} } = chart;

      let labels: string[];
      let values: number[];
      let datasets: any[];

      if (this.isTimeSeriesData(data)) {
        labels = data.map((d: TimeSeriesData) => d.date);
        values = data.map((d: TimeSeriesData) => d.value);
        datasets = [{
          label: chart.title,
          data: values,
          backgroundColor: this.getChartColors(type, values.length),
          borderColor: type === 'line' || type === 'area' ? 'rgb(75, 192, 192)' : undefined,
          borderWidth: type === 'line' || type === 'area' ? 2 : 1,
          fill: type === 'area' ? true : false
        }];
      } else {
        const chartData = data as ChartDataPoint[];
        labels = chartData.map(d => d.label);
        values = chartData.map(d => d.value);
        const colors = chartData.map(d => d.color) || this.getChartColors(type, values.length);

        datasets = [{
          label: chart.title,
          data: values,
          backgroundColor: colors,
          borderColor: type === 'line' ? colors[0] : undefined,
          borderWidth: type === 'line' ? 2 : 1
        }];
      }

      const chartConfig = {
        type: type === 'area' ? 'line' : type,
        data: { labels, datasets },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: options.showLegend !== false },
            title: {
              display: true,
              text: chart.title,
              font: { size: 14, weight: 'bold' as const }
            }
          },
          scales: type !== 'pie' && type !== 'doughnut' ? {
            y: { beginAtZero: true },
            x: {}
          } : undefined
        }
      };

      return {
        id: chartId,
        config: chartConfig
      };
    });

    return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js"></script>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
      padding: 20px;
      background: #f7fafc;
    }
    .dashboard-header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 30px;
      border-radius: 12px;
      margin-bottom: 30px;
      box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
    }
    .dashboard-title {
      font-size: 32px;
      font-weight: bold;
      margin-bottom: 10px;
    }
    .dashboard-subtitle {
      font-size: 16px;
      opacity: 0.9;
    }
    .charts-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
      gap: 20px;
    }
    .chart-card {
      background: white;
      border-radius: 12px;
      padding: 20px;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    }
    .chart-container {
      position: relative;
      height: 300px;
      margin-top: 15px;
    }
    @media (max-width: 768px) {
      .charts-grid {
        grid-template-columns: 1fr;
      }
    }
  </style>
</head>
<body>
  <div class="dashboard-header">
    <div class="dashboard-title">${title}</div>
    <div class="dashboard-subtitle">Real Estate CRM Analytics</div>
  </div>

  <div class="charts-grid">
    ${chartsHTML.map(chart => `
      <div class="chart-card">
        <div class="chart-container">
          <canvas id="${chart.id}"></canvas>
        </div>
      </div>
    `).join('')}
  </div>

  <script>
    const charts = ${JSON.stringify(chartsHTML)};
    charts.forEach(chartData => {
      const ctx = document.getElementById(chartData.id).getContext('2d');
      new Chart(ctx, chartData.config);
    });
  </script>
</body>
</html>
    `.trim();
  }

  /**
   * Type guard to check if data is time series
   */
  private static isTimeSeriesData(data: any[]): data is TimeSeriesData[] {
    return data.length > 0 && 'date' in data[0] && 'value' in data[0];
  }

  /**
   * Get color palette based on chart type
   */
  private static getChartColors(type: string, count: number): string[] {
    const palettes = {
      default: [
        'rgba(102, 126, 234, 0.8)',
        'rgba(118, 75, 162, 0.8)',
        'rgba(237, 100, 166, 0.8)',
        'rgba(255, 154, 158, 0.8)',
        'rgba(250, 208, 196, 0.8)',
        'rgba(255, 183, 77, 0.8)',
        'rgba(129, 199, 132, 0.8)',
        'rgba(79, 195, 247, 0.8)'
      ],
      gradient: [
        'rgba(99, 102, 241, 0.8)',
        'rgba(139, 92, 246, 0.8)',
        'rgba(168, 85, 247, 0.8)',
        'rgba(217, 70, 239, 0.8)',
        'rgba(236, 72, 153, 0.8)'
      ]
    };

    const palette = type === 'line' || type === 'area' ? palettes.gradient : palettes.default;
    const colors: string[] = [];

    for (let i = 0; i < count; i++) {
      colors.push(palette[i % palette.length]);
    }

    return colors;
  }
}

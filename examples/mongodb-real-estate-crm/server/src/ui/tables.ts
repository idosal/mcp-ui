export class TableUIGenerator {
  /**
   * Generate interactive HTML table from data
   */
  static generateTableHTML(
    data: any[],
    columns: { key: string; label: string; format?: (val: any) => string }[],
    title: string = 'Data Table',
    options: {
      sortable?: boolean;
      filterable?: boolean;
      exportable?: boolean;
      rowsPerPage?: number;
    } = {}
  ): string {
    const {
      sortable = true,
      filterable = true,
      exportable = true,
      rowsPerPage = 20
    } = options;

    const tableId = `table-${Math.random().toString(36).substr(2, 9)}`;

    // Prepare column definitions
    const columnDefs = columns.map(col => ({
      key: col.key,
      label: col.label,
      format: col.format ? col.format.toString() : null
    }));

    return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
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
    .table-container {
      max-width: 1200px;
      margin: 0 auto;
      background: white;
      border-radius: 12px;
      box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
      overflow: hidden;
    }
    .table-header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 25px 30px;
    }
    .table-title {
      font-size: 24px;
      font-weight: bold;
      margin-bottom: 5px;
    }
    .table-subtitle {
      font-size: 14px;
      opacity: 0.9;
    }
    .table-controls {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 20px 30px;
      border-bottom: 1px solid #e2e8f0;
      flex-wrap: wrap;
      gap: 15px;
    }
    .search-box {
      display: flex;
      align-items: center;
      gap: 10px;
      flex: 1;
      min-width: 250px;
    }
    .search-input {
      flex: 1;
      padding: 10px 15px;
      border: 1px solid #cbd5e0;
      border-radius: 6px;
      font-size: 14px;
    }
    .search-input:focus {
      outline: none;
      border-color: #667eea;
      box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
    }
    .export-buttons {
      display: flex;
      gap: 10px;
    }
    .btn {
      padding: 10px 20px;
      border: none;
      border-radius: 6px;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
    }
    .btn-primary {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
    }
    .btn-primary:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
    }
    .btn-secondary {
      background: #e2e8f0;
      color: #2d3748;
    }
    .btn-secondary:hover {
      background: #cbd5e0;
    }
    .table-wrapper {
      overflow-x: auto;
      padding: 0 30px 30px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 20px;
    }
    th {
      background: #f7fafc;
      padding: 15px;
      text-align: left;
      font-weight: 600;
      color: #2d3748;
      border-bottom: 2px solid #e2e8f0;
      cursor: ${sortable ? 'pointer' : 'default'};
      user-select: none;
      position: relative;
    }
    th:hover {
      background: ${sortable ? '#edf2f7' : '#f7fafc'};
    }
    th.sortable::after {
      content: '⇅';
      position: absolute;
      right: 10px;
      opacity: 0.3;
    }
    th.sorted-asc::after {
      content: '↑';
      opacity: 1;
    }
    th.sorted-desc::after {
      content: '↓';
      opacity: 1;
    }
    td {
      padding: 15px;
      border-bottom: 1px solid #e2e8f0;
      color: #4a5568;
    }
    tr:hover {
      background: #f7fafc;
    }
    tr.hidden {
      display: none;
    }
    .pagination {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 20px 30px;
      border-top: 1px solid #e2e8f0;
    }
    .pagination-info {
      color: #718096;
      font-size: 14px;
    }
    .pagination-buttons {
      display: flex;
      gap: 10px;
    }
    .no-results {
      text-align: center;
      padding: 40px;
      color: #718096;
      font-size: 16px;
    }
  </style>
</head>
<body>
  <div class="table-container">
    <div class="table-header">
      <div class="table-title">${title}</div>
      <div class="table-subtitle">${data.length} total records</div>
    </div>

    <div class="table-controls">
      ${filterable ? `
        <div class="search-box">
          <input
            type="text"
            id="searchInput"
            class="search-input"
            placeholder="Search..."
          />
        </div>
      ` : '<div></div>'}

      ${exportable ? `
        <div class="export-buttons">
          <button class="btn btn-secondary" onclick="exportToCSV()">
            Export CSV
          </button>
          <button class="btn btn-secondary" onclick="exportToJSON()">
            Export JSON
          </button>
        </div>
      ` : ''}
    </div>

    <div class="table-wrapper">
      <table id="${tableId}">
        <thead>
          <tr>
            ${columns.map(col => `
              <th class="${sortable ? 'sortable' : ''}" data-key="${col.key}">
                ${col.label}
              </th>
            `).join('')}
          </tr>
        </thead>
        <tbody id="tableBody">
          <!-- Data will be inserted here -->
        </tbody>
      </table>
      <div id="noResults" class="no-results" style="display: none;">
        No results found
      </div>
    </div>

    <div class="pagination">
      <div class="pagination-info" id="paginationInfo"></div>
      <div class="pagination-buttons">
        <button class="btn btn-secondary" id="prevBtn" onclick="changePage(-1)">
          Previous
        </button>
        <button class="btn btn-secondary" id="nextBtn" onclick="changePage(1)">
          Next
        </button>
      </div>
    </div>
  </div>

  <script>
    const data = ${JSON.stringify(data)};
    const columns = ${JSON.stringify(columnDefs)};
    const rowsPerPage = ${rowsPerPage};

    let currentPage = 1;
    let filteredData = [...data];
    let sortColumn = null;
    let sortDirection = 'asc';

    // Initialize table
    function renderTable() {
      const tbody = document.getElementById('tableBody');
      const noResults = document.getElementById('noResults');

      if (filteredData.length === 0) {
        tbody.innerHTML = '';
        noResults.style.display = 'block';
        updatePagination();
        return;
      }

      noResults.style.display = 'none';
      const start = (currentPage - 1) * rowsPerPage;
      const end = start + rowsPerPage;
      const pageData = filteredData.slice(start, end);

      tbody.innerHTML = pageData.map(row => {
        return '<tr>' + columns.map(col => {
          let value = row[col.key];

          // Apply formatter if provided
          if (col.format) {
            try {
              const formatter = eval('(' + col.format + ')');
              value = formatter(value);
            } catch (e) {
              // Use default formatting
            }
          }

          // Default formatting
          if (typeof value === 'number') {
            value = value.toLocaleString();
          } else if (value instanceof Date || (typeof value === 'string' && !isNaN(Date.parse(value)))) {
            value = new Date(value).toLocaleDateString();
          } else if (value === null || value === undefined) {
            value = '-';
          }

          return '<td>' + value + '</td>';
        }).join('') + '</tr>';
      }).join('');

      updatePagination();
    }

    // Update pagination info
    function updatePagination() {
      const start = (currentPage - 1) * rowsPerPage + 1;
      const end = Math.min(currentPage * rowsPerPage, filteredData.length);
      const total = filteredData.length;

      document.getElementById('paginationInfo').textContent =
        \`Showing \${start}-\${end} of \${total} records\`;

      document.getElementById('prevBtn').disabled = currentPage === 1;
      document.getElementById('nextBtn').disabled = end >= total;
    }

    // Change page
    function changePage(delta) {
      const maxPage = Math.ceil(filteredData.length / rowsPerPage);
      currentPage = Math.max(1, Math.min(maxPage, currentPage + delta));
      renderTable();
    }

    // Sort table
    ${sortable ? `
      document.querySelectorAll('th.sortable').forEach(th => {
        th.addEventListener('click', () => {
          const key = th.dataset.key;

          if (sortColumn === key) {
            sortDirection = sortDirection === 'asc' ? 'desc' : 'asc';
          } else {
            sortColumn = key;
            sortDirection = 'asc';
          }

          // Update UI
          document.querySelectorAll('th').forEach(h => {
            h.classList.remove('sorted-asc', 'sorted-desc');
          });
          th.classList.add('sorted-' + sortDirection);

          // Sort data
          filteredData.sort((a, b) => {
            let valA = a[key];
            let valB = b[key];

            // Handle different types
            if (typeof valA === 'string') valA = valA.toLowerCase();
            if (typeof valB === 'string') valB = valB.toLowerCase();

            if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
            if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
            return 0;
          });

          currentPage = 1;
          renderTable();
        });
      });
    ` : ''}

    // Search/filter
    ${filterable ? `
      document.getElementById('searchInput').addEventListener('input', (e) => {
        const searchTerm = e.target.value.toLowerCase();

        filteredData = data.filter(row => {
          return Object.values(row).some(val => {
            if (val === null || val === undefined) return false;
            return String(val).toLowerCase().includes(searchTerm);
          });
        });

        currentPage = 1;
        renderTable();
      });
    ` : ''}

    // Export functions
    ${exportable ? `
      function exportToCSV() {
        const headers = columns.map(col => col.label).join(',');
        const rows = filteredData.map(row => {
          return columns.map(col => {
            let val = row[col.key];
            if (val === null || val === undefined) val = '';
            return '"' + String(val).replace(/"/g, '""') + '"';
          }).join(',');
        });

        const csv = [headers, ...rows].join('\\n');
        downloadFile(csv, '${title.replace(/\s+/g, '_')}.csv', 'text/csv');
      }

      function exportToJSON() {
        const json = JSON.stringify(filteredData, null, 2);
        downloadFile(json, '${title.replace(/\s+/g, '_')}.json', 'application/json');
      }

      function downloadFile(content, filename, type) {
        const blob = new Blob([content], { type });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
    ` : ''}

    // Initial render
    renderTable();
  </script>
</body>
</html>
    `.trim();
  }
}


// Generate raw HTML for flight results
export function generateFlightResultsHTML(flightData: any, originCity: string, destinationCity: string, dateOfTravel: string): string {
    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Flight Search Results</title>
        <style>
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            margin: 0;
            padding: 20px;
            background-color: #f5f7fa;
            color: #333;
          }
          .container {
            max-width: 800px;
            margin: 0 auto;
          }
          .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 30px;
            border-radius: 12px;
            margin-bottom: 30px;
            text-align: center;
          }
          .header h1 {
            margin: 0 0 10px 0;
            font-size: 2.5em;
            font-weight: 300;
          }
          .search-info {
            background-color: white;
            padding: 20px;
            border-radius: 8px;
            margin-bottom: 25px;
            border-left: 4px solid #667eea;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
          }
          .search-info h2 {
            margin: 0 0 15px 0;
            color: #667eea;
            font-size: 1.3em;
          }
          .route {
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 15px 0;
            font-size: 1.1em;
          }
          .city {
            font-weight: bold;
            color: #333;
          }
          .arrow {
            margin: 0 15px;
            color: #667eea;
            font-size: 1.5em;
          }
          .flight-grid {
            display: grid;
            gap: 20px;
          }
          .flight-card {
            background: white;
            border-radius: 12px;
            box-shadow: 0 4px 15px rgba(0,0,0,0.1);
            border: 1px solid #e1e5e9;
            transition: transform 0.2s ease, box-shadow 0.2s ease;
            overflow: hidden;
          }
          .flight-card:hover {
            transform: translateY(-2px);
            box-shadow: 0 8px 25px rgba(0,0,0,0.15);
          }
          .flight-table {
            width: 100%;
            border-collapse: collapse;
          }
          .flight-table th,
          .flight-table td {
            padding: 15px;
            text-align: left;
            border-bottom: 1px solid #f1f3f4;
          }
          .flight-table th {
            background-color: #f8f9fa;
            font-weight: 600;
            color: #495057;
            font-size: 0.9em;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          .flight-table tr:last-child td {
            border-bottom: none;
          }
          .flight-id {
            font-size: 1.2em;
            font-weight: bold;
            color: #2c3e50;
          }
          .price-cell {
            text-align: right;
            vertical-align: middle;
          }
          .price {
            font-size: 1.8em;
            font-weight: bold;
            color: #27ae60;
            line-height: 1;
          }
          .discount-badge {
            background: #e74c3c;
            color: white;
            font-size: 0.7em;
            padding: 2px 6px;
            border-radius: 8px;
            margin-top: 3px;
            display: inline-block;
          }
          .price-label {
            color: #7f8c8d;
            font-size: 0.8em;
            margin-top: 3px;
          }
          .duration-cell {
            font-weight: 600;
            color: #495057;
          }
          .layover-cell {
            color: #6c757d;
          }
          .feature-badges {
            display: flex;
            gap: 8px;
            flex-wrap: wrap;
          }
          .feature-badge {
            background: #f8f9fa;
            border: 1px solid #e9ecef;
            border-radius: 12px;
            padding: 4px 8px;
            font-size: 0.75em;
            color: #6c757d;
            white-space: nowrap;
          }
          .feature-badge.pet-friendly {
            background: #d4edda;
            border-color: #c3e6cb;
            color: #155724;
          }
          .feature-badge.direct {
            background: #d1ecf1;
            border-color: #bee5eb;
            color: #0c5460;
          }
          .book-button {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            border: none;
            padding: 12px 24px;
            border-radius: 8px;
            font-size: 1em;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s ease;
            width: 100%;
            margin: 15px;
          }
          .book-button:hover {
            transform: translateY(-1px);
            box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
          }
          .no-flights {
            text-align: center;
            padding: 40px;
            color: #7f8c8d;
            font-size: 1.2em;
          }
          @media (max-width: 768px) {
            .flight-table th,
            .flight-table td {
              padding: 10px 8px;
              font-size: 0.9em;
            }
            .price {
              font-size: 1.4em;
            }
            .feature-badges {
              gap: 4px;
            }
            .feature-badge {
              font-size: 0.7em;
              padding: 2px 6px;
            }
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>✈️ Flight Search Results</h1>
            <p>Find your perfect flight</p>
          </div>
          
          <div class="search-info">
            <h2>Search Details</h2>
            <div class="route">
              <span class="city">${originCity}</span>
              <span class="arrow">→</span>
              <span class="city">${destinationCity}</span>
            </div>
            <p><strong>Travel Date:</strong> ${new Date(dateOfTravel).toLocaleDateString('en-US', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}</p>
            <p><strong>Results:</strong> ${flightData.flights.length} flight${flightData.flights.length !== 1 ? 's' : ''} found</p>
          </div>
          
          <div class="flight-grid">
            ${flightData.flights.length === 0 ? 
              '<div class="no-flights">No flights found for your search criteria.</div>' :
              flightData.flights.map((flight: any) => `
                <div class="flight-card">
                  <table class="flight-table">
                    <thead>
                      <tr>
                        <th>Flight</th>
                        <th>Route</th>
                        <th>Duration</th>
                        <th>Stops</th>
                        <th>Features</th>
                        <th>Price</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td>
                          <div class="flight-id">${flight.flightId}</div>
                        </td>
                        <td>
                          <div><strong>${originCity}</strong> → <strong>${destinationCity}</strong></div>
                        </td>
                        <td class="duration-cell">
                          ${Math.floor(flight.durationInMin / 60)}h ${flight.durationInMin % 60}m
                        </td>
                        <td class="layover-cell">
                          ${flight.numLayovers === 0 ? 'Direct' : `${flight.numLayovers} stop${flight.numLayovers > 1 ? 's' : ''}`}
                        </td>
                        <td>
                          <div class="feature-badges">
                            ${flight.isPetAllowed ? 
                              '<span class="feature-badge pet-friendly">🐕 Pet Friendly</span>' : 
                              '<span class="feature-badge">❌ No Pets</span>'
                            }
                            ${flight.numLayovers === 0 ? 
                              '<span class="feature-badge direct">✈️ Direct</span>' : 
                              ''
                            }
                          </div>
                        </td>
                        <td class="price-cell">
                          <div class="price">$${flight.price.toFixed(2)}</div>
                          ${flight.discountPercentage > 0 ? 
                            `<div class="discount-badge">${flight.discountPercentage.toFixed(1)}% OFF</div>` : 
                            ''
                          }
                          <div class="price-label">per person</div>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                  <button class="book-button" onclick="alert('Booking ${flight.flightId}')">
                    Book This Flight
                  </button>
                </div>
              `).join('')
            }
          </div>
        </div>
      </body>
      </html>
    `;
  }
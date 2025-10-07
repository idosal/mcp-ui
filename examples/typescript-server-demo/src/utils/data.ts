// Sample flight data generator that matches FlightResponseSchema structure
function getAvailableFlights(originCity: string, destinationCity: string, maxPrice: number, targetDiscountPercentage: number): any {
    const airlines = [
      "American Airlines", "Delta Air Lines", "United Airlines", "Southwest Airlines",
      "JetBlue Airways", "Alaska Airlines", "Spirit Airlines", "Frontier Airlines"
    ];
    
    const flightPrefixes = ["AA", "DL", "UA", "WN", "B6", "AS", "NK", "F9"];
    
    // Generate random flight data that matches the FlightResponseSchema
    const sampleFlights = [
      {
        flightId: `${flightPrefixes[0]}${Math.floor(Math.random() * 9000) + 1000}`,
        numLayovers: Math.floor(Math.random() * 3), // 0-2 layovers
        isPetAllowed: Math.random() > 0.3, // 70% chance pets allowed
        price: Math.floor(Math.random() * (maxPrice * 0.8) + (maxPrice * 0.2)), // Price within range
        discountPercentage: Math.round((Math.max(0, targetDiscountPercentage + (Math.random() - 0.5) * 20)) * 100) / 100, // ±10% variance
        durationInMin: Math.floor(Math.random() * 300) + 120 // 2-7 hours flight time
      },
      {
        flightId: `${flightPrefixes[1]}${Math.floor(Math.random() * 9000) + 1000}`,
        numLayovers: Math.floor(Math.random() * 2), // 0-1 layovers
        isPetAllowed: Math.random() > 0.4, // 60% chance pets allowed
        price: Math.floor(Math.random() * (maxPrice * 0.9) + (maxPrice * 0.1)),
        discountPercentage: Math.round((Math.max(0, targetDiscountPercentage + (Math.random() - 0.5) * 15)) * 100) / 100,
        durationInMin: Math.floor(Math.random() * 240) + 150 // 2.5-6.5 hours
      },
      {
        flightId: `${flightPrefixes[2]}${Math.floor(Math.random() * 9000) + 1000}`,
        numLayovers: Math.floor(Math.random() * 3), // 0-2 layovers
        isPetAllowed: Math.random() > 0.5, // 50% chance pets allowed
        price: Math.floor(Math.random() * (maxPrice * 0.7) + (maxPrice * 0.3)),
        discountPercentage: Math.round((Math.max(0, targetDiscountPercentage + (Math.random() - 0.5) * 25)) * 100) / 100,
        durationInMin: Math.floor(Math.random() * 360) + 90 // 1.5-7.5 hours
      },
      {
        flightId: `${flightPrefixes[3]}${Math.floor(Math.random() * 9000) + 1000}`,
        numLayovers: Math.floor(Math.random() * 2), // 0-1 layovers (budget airline, fewer layovers)
        isPetAllowed: Math.random() > 0.6, // 40% chance pets allowed (stricter policy)
        price: Math.floor(Math.random() * (maxPrice * 0.6) + (maxPrice * 0.2)), // Generally cheaper
        discountPercentage: Math.round((Math.max(0, targetDiscountPercentage + (Math.random() - 0.5) * 30)) * 100) / 100,
        durationInMin: Math.floor(Math.random() * 200) + 100 // 1.7-5 hours (direct routes)
      },
      {
        flightId: `${flightPrefixes[4]}${Math.floor(Math.random() * 9000) + 1000}`,
        numLayovers: Math.floor(Math.random() * 2), // 0-1 layovers
        isPetAllowed: Math.random() > 0.2, // 80% chance pets allowed (pet-friendly)
        price: Math.floor(Math.random() * (maxPrice * 0.85) + (maxPrice * 0.15)),
        discountPercentage: Math.round((Math.max(0, targetDiscountPercentage + (Math.random() - 0.5) * 18)) * 100) / 100,
        durationInMin: Math.floor(Math.random() * 280) + 130 // 2.2-6.8 hours
      }
    ];
  
    // Filter flights that are within the price range and have reasonable discount
    const filteredFlights = sampleFlights.filter(flight => 
      flight.price <= maxPrice && 
      flight.discountPercentage >= (targetDiscountPercentage * 0.5)
    );
  
    console.log("Available Flights\n: %s", JSON.stringify(filteredFlights, null, 2));
  
    return {
      flights: filteredFlights
    };
  }
  
  export { getAvailableFlights };
  
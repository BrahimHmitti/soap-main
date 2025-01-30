const soap = require("soap")
const url = "http://localhost:3001/wsdl?wsdl"

async function testServices() {
  try {
    const client = await soap.createClientAsync(url)

    // Test searchTrains
    const searchResult = await client.searchTrainsAsync({
      departureStation: "Paris",
      arrivalStation: "London",
      departureDateTime: "2023-06-01T00:00:00",
      returnDateTime: "2023-06-02T00:00:00",
      numTickets: 2,
      travelClass: "Business",
    })
    console.log("Search Result:", JSON.parse(searchResult[0].result))

    // Test bookTrain
    const bookResult = await client.bookTrainAsync({
      trainIds: JSON.stringify(["T001"]),
      travelClass: "Business",
      ticketType: "flexible",
    })
    console.log("Booking Result:", bookResult[0].result)

    // Test searchTrains again to see updated availability
    const updatedSearchResult = await client.searchTrainsAsync({
      departureStation: "Paris",
      arrivalStation: "London",
      departureDateTime: "2023-06-01T00:00:00",
      returnDateTime: "2023-06-02T00:00:00",
      numTickets: 2,
      travelClass: "Business",
    })
    console.log("Updated Search Result:", JSON.parse(updatedSearchResult[0].result))
  } catch (error) {
    console.error("Error:", error)
  }
}

testServices()


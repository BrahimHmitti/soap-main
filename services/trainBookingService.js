const express = require("express");
const cors = require("cors");
const soap = require("soap");

const app = express(); // Initialisation de app avant de l'utiliser
const PORT = 3001;

app.use(cors());
app.use(express.json());

const serviceObject = {
  TrainBookingService: {
    TrainBookingPort: {
      searchTrains: async (args) => {
        try {
          const response = await fetch("http://localhost:3000/filter-trains", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(args),
          })
          const data = await response.json()
          return { result: JSON.stringify(data) }
        } catch (error) {
          console.error("Error in searchTrains:", error)
          throw new Error("Failed to search trains")
        }
      },
      bookTrain: async (args) => {
        try {
          // On récupère les arguments
          let { trainIds, travelClass, ticketType } = args
      
          // Vérifier si trainIds est une chaîne JSON (ex: '["T001"]') plutôt qu'un tableau
          if (typeof trainIds === "string") {
            trainIds = JSON.parse(trainIds) 
            // maintenant trainIds devient un vrai tableau, ex: ["T001"]
          }
      
          let allSuccess = true
          let errorMessage = ""
      
          // Parcours des ID (maintenant un tableau)
          for (const trainId of trainIds) {
            const response = await fetch("http://localhost:3000/update-reservation", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ trainId, travelClass, numTickets: 1 }),
            })
            const data = await response.json()
            if (!data.success) {
              allSuccess = false
              errorMessage = data.message
              break
            }
          }
      
          if (allSuccess) {
            return { result: "Successful reservation" }
          } else {
            return { result: `Reservation error: ${errorMessage}` }
          }
        } catch (error) {
          console.error("Error in bookTrain:", error)
          throw new Error("Failed to book train")
        }
      },
    },
  },
}

const xml = require("fs").readFileSync("trainBookingService.wsdl", "utf8")

app.listen(PORT, () => {
  soap.listen(app, "/wsdl", serviceObject, xml)
  console.log(`Train Booking SOAP Service is running on port ${PORT}`)
})


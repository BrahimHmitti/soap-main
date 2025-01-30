const express = require("express");
const cors = require("cors");
const fs = require("fs").promises;
const path = require("path");
const swaggerJsdoc = require("swagger-jsdoc");
const swaggerUi = require("swagger-ui-express");

const app = express();

app.use(cors());
app.use(express.json());

const PORT = 3000;

// Read trains data
async function getTrains() {
  const data = await fs.readFile(path.join(__dirname, "../data/trains.json"), "utf8")
  return JSON.parse(data)
}

// Update trains data
async function updateTrains(trains) {
  await fs.writeFile(path.join(__dirname, "../data/trains.json"), JSON.stringify(trains, null, 2))
}

/**
 * @swagger
 * /filter-trains:
 *   post:
 *     summary: Filter available trains
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               departureStation:
 *                 type: string
 *               arrivalStation:
 *                 type: string
 *               departureDateTime:
 *                 type: string
 *               returnDateTime:
 *                 type: string
 *               numTickets:
 *                 type: integer
 *               travelClass:
 *                 type: string
 *                 enum: [First, Business, Standard]
 *     responses:
 *       200:
 *         description: List of available trains
 */
app.post("/filter-trains", async (req, res) => {
  const { departureStation, arrivalStation, departureDateTime, returnDateTime, numTickets, travelClass } = req.body
  const trains = await getTrains()

  const filteredTrains = trains.filter(
    (train) =>
      train.departureStation === departureStation &&
      train.arrivalStation === arrivalStation &&
      new Date(train.departureDateTime) >= new Date(departureDateTime) &&
      train.availableSeats[travelClass] >= numTickets,
  )

  if (filteredTrains.length === 0) {
    return res.status(404).json({ message: "No available trains." })
  }

  const result = filteredTrains.map((train) => ({
    id: train.id,
    departureDateTime: train.departureDateTime,
    arrivalDateTime: train.arrivalDateTime,
    availableSeats: train.availableSeats[travelClass],
    fares: train.fares[travelClass],
  }))

  res.json(result)
})

/**
 * @swagger
 * /update-reservation:
 *   post:
 *     summary: Update train reservation
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               trainId:
 *                 type: string
 *               travelClass:
 *                 type: string
 *                 enum: [First, Business, Standard]
 *               numTickets:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Reservation update status
 */
app.post("/update-reservation", async (req, res) => {
  const { trainId, travelClass, numTickets } = req.body
  const trains = await getTrains()
  console.log("Body received in update-reservation:", req.body); 
  console.log("trainId type:", typeof trainId, " / value:", trainId);
  console.log("Available trains are:", trains.map(t => t.id));
  const trainIndex = trains.findIndex((train) => train.id === trainId)
  console.log("TrainIndex found is", trainIndex);
  if (trainIndex === -1) {
    return res.json({ success: false, message: "Train not found" })
  }

  const train = trains[trainIndex]
  if (train.availableSeats[travelClass] < numTickets) {
    return res.json({ success: false, message: "Not enough seats available" })
  }

  train.availableSeats[travelClass] -= numTickets
  await updateTrains(trains)

  res.json({ success: true, message: "Reservation successful" })
})

// Swagger setup
const swaggerOptions = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Train Filtering API",
      version: "1.0.0",
      description: "API for filtering and updating train information",
    },
    servers: [
      {
        url: `http://localhost:${PORT}`,
      },
    ],
  },
  apis: ["./services/trainFilteringService.js"],
}

const swaggerSpec = swaggerJsdoc(swaggerOptions)
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec))

app.listen(PORT, () => {
  console.log(`Train Filtering Service is running on port ${PORT}`)
  console.log(`API documentation available at http://localhost:${PORT}/api-docs`)
})


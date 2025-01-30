"use client"
import React, { useState } from "react"
import trainsData from "../data/trains.json"

// Types
type SearchResult = {
  error?: string
  trains?: any[]
  message?: string
}

type BookingResult = {
  error?: string
  success?: string
  response?: string
}

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('fr-FR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const stations = [...new Set(trainsData.flatMap(t => [t.departureStation, t.arrivalStation]))]
const departureTimes = [...new Set(trainsData.map(t => t.departureDateTime))]
const returnTimes = [...new Set(trainsData.map(t => t.arrivalDateTime))]
const travelClasses = ["First", "Business", "Standard"]
const trainIds = trainsData.map(t => t.id)

export default function TrainBookingPage() {
  const [searchResult, setSearchResult] = useState<SearchResult | null>(null)
  const [bookingResult, setBookingResult] = useState<BookingResult | null>(null)

  const handleSearch = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const bodyData = {
      departureStation: formData.get("departureStation"),
      arrivalStation: formData.get("arrivalStation"),
      departureDateTime: formData.get("outboundDateTime"),
      returnDateTime: formData.get("returnDateTime"),
      numTickets: Number(formData.get("numTickets")),
      travelClass: formData.get("travelClass"),
    }
    try {
      console.log("Searching trains:", bodyData)
      const res = await fetch("http://localhost:3000/filter-trains", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(bodyData),
      })
      const data = await res.json()
      if (data.message === "No available trains.") {
        setSearchResult({
          error: "No trains available for these criteria. Please try different options."
        })
      } else {
        setSearchResult({ trains: data })
      }
    } catch (error) {
      setSearchResult({
        error: "Failed to search trains. Please try again later."
      })
    }
  }

  const handleBooking = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const bodyData = {
      trainIds: formData.get("trainIds"),
      travelClass: formData.get("bookingClass"),
      ticketType: formData.get("ticketType"),
    }
    try {
      console.log("Booking train:", bodyData)
      const res = await fetch("http://localhost:3001/wsdl", {
        method: "POST",
        headers: { 
          "Content-Type": "application/soap+xml",
          "SOAPAction": "http://example.com/trainbooking.wsdl/bookTrain"
        },
        body: `<Envelope xmlns="http://schemas.xmlsoap.org/soap/envelope/">
          <Body>
            <bookTrain xmlns="http://example.com/trainbooking.wsdl">
              <trainIds>${bodyData.trainIds}</trainIds>
              <travelClass>${bodyData.travelClass}</travelClass>
              <ticketType>${bodyData.ticketType}</ticketType>
            </bookTrain>
          </Body>
        </Envelope>`,
      })
      const text = await res.text()
      if (text.includes("Successful reservation")) {
        setBookingResult({
          success: "Booking completed successfully!",
          response: text
        })
      } else {
        setBookingResult({
          error: "Booking failed. Please try again.",
          response: text
        })
      }
    } catch (error) {
      setBookingResult({
        error: "Failed to connect to booking service. Please try again later."
      })
    }
  }

  return (
    <main className="container mx-auto p-4 max-w-2xl">
      <h1 className="text-2xl font-bold mb-8">Train Booking System</h1>

      {/* Search Form */}
      <div className="bg-white p-6 rounded-lg shadow-md mb-8">
        <h2 className="text-xl font-semibold mb-4">Search Trains</h2>
        <form onSubmit={handleSearch} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <label className="block">
              <span className="text-gray-700">Departure:</span>
              <select name="departureStation" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm">
                {stations.map(station => (
                  <option key={station} value={station}>{station}</option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="text-gray-700">Arrival:</span>
              <select name="arrivalStation" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm">
                {stations.map(station => (
                  <option key={station} value={station}>{station}</option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="text-gray-700">Outbound:</span>
              <select name="outboundDateTime" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm">
                {departureTimes.map(time => (
                  <option key={time} value={time}>{formatDate(time)}</option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="text-gray-700">Return:</span>
              <select name="returnDateTime" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm">
                {returnTimes.map(time => (
                  <option key={time} value={time}>{formatDate(time)}</option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="text-gray-700">Tickets:</span>
              <select name="numTickets" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm">
                {[1,2,3,4,5].map(num => (
                  <option key={num} value={num}>{num}</option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="text-gray-700">Class:</span>
              <select name="travelClass" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm">
                {travelClasses.map(tClass => (
                  <option key={tClass} value={tClass}>{tClass}</option>
                ))}
              </select>
            </label>
          </div>

          <button type="submit" className="w-full bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600">
            Search Trains
          </button>
        </form>

        {searchResult && (
          <div className="mt-4 p-4 bg-gray-50 rounded-md">
            {searchResult.error ? (
              <div className="text-red-500">{searchResult.error}</div>
            ) : (
              <pre className="whitespace-pre-wrap">{JSON.stringify(searchResult.trains, null, 2)}</pre>
            )}
          </div>
        )}
      </div>

      {/* Booking Form */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold mb-4">Book Train</h2>
        <form onSubmit={handleBooking} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <label className="block">
              <span className="text-gray-700">Train:</span>
              <select name="trainIds" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm">
                {trainIds.map(id => (
                  <option key={id} value={`["${id}"]`}>{id}</option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="text-gray-700">Class:</span>
              <select name="bookingClass" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm">
                {travelClasses.map(tClass => (
                  <option key={tClass} value={tClass}>{tClass}</option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="text-gray-700">Ticket Type:</span>
              <select name="ticketType" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm">
                <option value="flexible">Flexible</option>
                <option value="notFlexible">Not Flexible</option>
              </select>
            </label>
          </div>

          <button type="submit" className="w-full bg-green-500 text-white py-2 px-4 rounded-md hover:bg-green-600">
            Book Train
          </button>
        </form>

        {bookingResult && (
          <div className="mt-4 p-4 bg-gray-50 rounded-md">
            {bookingResult.error ? (
              <div className="text-red-500">{bookingResult.error}</div>
            ) : (
              <div className="text-green-500">{bookingResult.success}</div>
            )}
            {bookingResult.response && (
              <pre className="mt-2 text-sm text-gray-600 whitespace-pre-wrap">
                {bookingResult.response}
              </pre>
            )}
          </div>
        )}
      </div>
    </main>
  )
}
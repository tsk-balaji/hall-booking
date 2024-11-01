const express = require("express");
const hallBookings = express();
hallBookings.use(express.json());

hallBookings.listen("3000", "0.0.0.0", () => {
  console.log("Server Started");
});

let rooms = [];
let bookings = [];
let roomIdCounter = 1;
let bookingIdCounter = 1;

// Create Room
hallBookings.post("/rooms", (req, res) => {
  const { numberOfSeats, amenities, pricePerHour } = req.body;

  const newRoom = {
    id: roomIdCounter++,
    numberOfSeats,
    amenities,
    pricePerHour,
    bookings: [], // Array to keep track of bookings for this room
  };

  rooms.push(newRoom);
  res.status(201).send(newRoom);
});

// Book a Room
hallBookings.post("/bookings", (req, res) => {
  const { customerName, date, startTime, endTime, roomId } = req.body;

  // Check if room exists
  const room = rooms.find((room) => room.id === roomId);
  if (!room) {
    return res.status(404).send({ error: "Room not found" });
  }

  // Check if the requested time slot is available
  const isRoomAvailable = bookings.every((booking) => {
    // Check if booking is for the same date and room
    if (booking.roomId === roomId && booking.date === date) {
      // Check for overlapping times
      return endTime <= booking.startTime || startTime >= booking.endTime;
    }
    return true; // If not the same room or date, it's considered available
  });

  if (!isRoomAvailable) {
    return res
      .status(400)
      .send({ error: "Room is already booked for the requested time" });
  }

  const newBooking = {
    id: bookingIdCounter++,
    customerName,
    date,
    startTime,
    endTime,
    roomId,
    bookingStatus: "confirmed",
    bookingDate: new Date(),
  };

  bookings.push(newBooking);
  room.bookings.push(newBooking.id); // Link booking to room

  res.status(201).send(newBooking);
});

// List All Rooms with Booked Data
hallBookings.get("/rooms", (req, res) => {
  const roomsWithBookings = rooms.map((room) => {
    const roomBookings = bookings
      .filter((booking) => booking.roomId === room.id)
      .map(({ customerName, date, startTime, endTime, bookingStatus }) => ({
        customerName,
        date,
        startTime,
        endTime,
        bookingStatus,
      }));

    return { ...room, bookings: roomBookings };
  });

  res.send(roomsWithBookings);
});

// List All Customers with Booked Data
hallBookings.get("/bookings/customers", (req, res) => {
  const customerBookings = bookings.map(
    ({ customerName, roomId, date, startTime, endTime }) => {
      const room = rooms.find((room) => room.id === roomId);
      return {
        customerName,
        roomId,
        roomName: room ? room.name : "Unknown",
        date,
        startTime,
        endTime,
      };
    }
  );

  res.send(customerBookings);
});

// List Booking History for a Customer
hallBookings.get("/bookings/customer/:customerName", (req, res) => {
  const { customerName } = req.params;

  const customerBookingHistory = bookings
    .filter((booking) => booking.customerName === customerName)
    .map(
      ({
        customerName,
        roomId,
        date,
        startTime,
        endTime,
        id,
        bookingDate,
        bookingStatus,
      }) => {
        const room = rooms.find((room) => room.id === roomId);
        return {
          customerName,
          roomName: room ? room.name : "Unknown",
          date,
          startTime,
          endTime,
          bookingId: id,
          bookingDate,
          bookingStatus,
        };
      }
    );

  res.send(customerBookingHistory);
});

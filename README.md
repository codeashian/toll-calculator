# Toll Calculator

A TypeScript-based toll calculator system that calculates toll fees for vehicles based on time of day, vehicle type, and holidays.

## Features

- Calculate toll fees based on time of day
- Support for different vehicle types (including toll-free vehicles)
- Holiday detection and toll-free days
- RESTful API endpoints for toll operations

## Prerequisites

- Node.js (v14 or higher)
- pnpm (package manager)

## Installation

```bash
pnpm install
```

## Running the Application

Start the development server:
```bash
pnpm dev
```

The server will start on port 3001.

## API Endpoints

### Get Toll Fees for a Vehicle
```http
GET /toll-fees/:licenseNumber
```
Returns all toll fees for a specific vehicle.

### Get Total Toll Fee for a Vehicle
```http
GET /toll-fees/:licenseNumber/total
```
Returns the total toll fee for a specific vehicle.

### Add Toll Fee
```http
POST /toll-fees
```
Adds a new toll fee for a vehicle.

Request body:
```json
{
    "licenseNumber": "ABC123",
    "date": "2025-02-03T06:02:00+01:00"
}
```

## Toll Rules

- Different rates apply based on time of day
- Maximum daily fee: 60 SEK
- Toll-free vehicles:
  - Military vehicles
  - Diplomatic vehicles
  - Emergency vehicles
  - Foreign vehicles
- Toll-free days:
  - Weekends
  - Holidays

## Testing

Run the test suite:
```bash
pnpm test
```

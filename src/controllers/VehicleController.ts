import { tollFreeVehicles, Vehicle, vehicles, VehicleType } from '../data/vehicles';
import { v4 as uuidv4 } from 'uuid';

export type CreateTollFee = {
    fee: number;
    date: Date;
};

export type TollFeeEntry = {
    fee: number;
    id: string;
    date: string;
};

// This class works as the database for the toll calculator.
// It is responsible for storing and retrieving toll fees for vehicles.
// Future improvements:
// - Use a database instead of a cache
// - Use a more efficient data structure for the cache
// - Add error handling
// - Add logging
// - Add tests
export default class VehicleController {
    private vehicleTollFeeCache: Map<string, TollFeeEntry[]> = new Map();

    public getVehicles = (): Vehicle[] => {
        return vehicles;
    };

    public getVehicleByLicenseNumber = (licenseNumber: string): Vehicle | undefined => {
        return this.getVehicles().find((v) => v.licenseNumber === licenseNumber);
    };

    public getTollFreeVehicles = (): VehicleType[] => {
        return tollFreeVehicles;
    };

    public getTollFeesByVehicle = (licenseNumber: string): TollFeeEntry[] => {
        return this.vehicleTollFeeCache.get(licenseNumber) || [];
    };

    public addTollFeeToVehicle = (licenseNumber: string, tollFee: number, date: Date) => {
        const tollFees = this.vehicleTollFeeCache.get(licenseNumber) || [];

        tollFees.push({
            id: uuidv4(),
            fee: tollFee,
            date: date.toISOString(),
        });

        this.vehicleTollFeeCache.set(licenseNumber, tollFees);
    };

    public getVehicleTotalTollFee = (licenseNumber: string): number => {
        const tollFees = this.vehicleTollFeeCache.get(licenseNumber) || [];

        return tollFees.reduce((fees, toll) => fees + toll.fee, 0);
    };

    public updateTollFee = (licenseNumber: string, fee: number, id: string) => {
        const tollFees = this.vehicleTollFeeCache.get(licenseNumber) || [];
        const tollFee = tollFees.find((t) => t.id === id);

        if (tollFee) {
            tollFee.fee = fee;
        }

        this.vehicleTollFeeCache.set(licenseNumber, tollFees);
    };

    public clearTollFees = () => {
        this.vehicleTollFeeCache.clear();
    };
}

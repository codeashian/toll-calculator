import HolidayController from '../controllers/HolidayController';
import { timeSlots } from '../data/time-slots';
import isHoliday from '../utils/isHoliday';
import VehicleController, { TollFeeEntry } from '../controllers/VehicleController';
import isWeekend from '../utils/isWeekend';

// This class is responsible for calculating the toll fee for a vehicle.
// It is responsible for fetching the toll fee for a vehicle and adding it to the vehicle.
// Future improvements:
// - Use a database instead of a cache
// - Add error handling
// - Add logging
export default class TollCalculatorService {
    constructor(
        private readonly holidayController: HolidayController,
        private readonly vehicleController: VehicleController
    ) {}

    public getVehicleTotalTollFee = (licenseNumber: string): number => {
        return this.vehicleController.getVehicleTotalTollFee(licenseNumber);
    };

    public getTollFeesByVehicle = (licenseNumber: string): TollFeeEntry[] => {
        const tollFees = this.vehicleController.getTollFeesByVehicle(licenseNumber);

        return tollFees.map((toll) => ({
            ...toll,
            date: new Date(toll.date).toLocaleString('sv-SE', { timeZone: 'Europe/Stockholm' }),
        }));
    };

    public registerTollFee = async (licenseNumber: string, date: Date): Promise<number> => {
        const tollFee = await this.calculateTollFee(licenseNumber, date);

        if (tollFee <= 0) {
            return 0;
        }

        const recentToll = this.getRecentVehicleToll(licenseNumber, date);

        if (recentToll && recentToll.fee >= tollFee) {
            return 0;
        }

        if (recentToll && recentToll.fee < tollFee) {
            this.vehicleController.updateTollFee(licenseNumber, tollFee, recentToll.id);
        } else {
            this.vehicleController.addTollFeeToVehicle(licenseNumber, tollFee, date);
        }

        return tollFee;
    };

    private calculateTollFee = async (licenseNumber: string, date: Date): Promise<number> => {
        if (this.isTollFreeVehicle(licenseNumber)) {
            return 0;
        }

        if (isWeekend(date)) {
            return 0;
        }

        const year = date.getFullYear();
        const holidays = await this.holidayController.fetchHolidaysByYear(year);

        if (isHoliday(date, holidays)) {
            return 0;
        }

        if ((await this.getVehicleTotalTollFeeByDate(licenseNumber, date)) >= 60) {
            return 0;
        }

        return this.getTollRateByDate(date);
    };

    private getVehicleTotalTollFeeByDate = async (
        licenseNumber: string,
        date: Date
    ): Promise<number> => {
        const tollFees = this.vehicleController.getTollFeesByVehicle(licenseNumber) || [];

        const tollFeesByDay = tollFees.filter(
            (toll) => new Date(toll.date).toDateString() === date.toDateString()
        );

        return tollFeesByDay.reduce((fees, toll) => fees + toll.fee, 0);
    };

    private isTollFreeVehicle = (licenseNumber: string): boolean => {
        const vehicle = this.vehicleController.getVehicleByLicenseNumber(licenseNumber);

        return this.vehicleController.getTollFreeVehicles().some((v) => v === vehicle?.type);
    };

    private getRecentVehicleToll = (
        licenseNumber: string,
        date: Date
    ): TollFeeEntry | undefined => {
        const tollFees = this.vehicleController.getTollFeesByVehicle(licenseNumber) || [];
        const oneHourAgo = new Date(date.getTime() - 1 * 60 * 60 * 1000);
        const oneHourLater = new Date(date.getTime() + 1 * 60 * 60 * 1000);

        const tollsWithinOneHour = tollFees.find((toll) => {
            const tollDate = new Date(toll.date);
            return (
                tollDate.getTime() > oneHourAgo.getTime() &&
                tollDate.getTime() < oneHourLater.getTime()
            );
        });

        return tollsWithinOneHour;
    };

    private getTollRateByDate = (date: Date): number => {
        const hour = date.getHours();
        const minute = date.getMinutes();
        const currentTime = hour * 60 + minute;

        for (const slot of timeSlots) {
            const { startHour, startMinute, endHour, endMinute, rate } = slot;

            if (
                currentTime >= startHour * 60 + startMinute &&
                currentTime <= endHour * 60 + endMinute
            ) {
                return rate;
            }
        }

        return 0;
    };
}

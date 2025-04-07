import VehicleController from './VehicleController';

const fee = 18;
const date = new Date('2025-01-01T07:00:00+01:00');

const licenseNumber = 'ABC123';

describe('VehicleService', () => {
    let vehicleController: VehicleController;

    beforeEach(() => {
        vehicleController = new VehicleController();
    });

    it('should add toll fee to vehicle', () => {
        vehicleController.addTollFeeToVehicle(licenseNumber, fee, date);

        const tollFees = vehicleController.getTollFeesByVehicle(licenseNumber);

        expect(tollFees).toHaveLength(1);
        expect(tollFees[0].date).toBe(date.toISOString());
    });

    it('should append to existing toll fees', () => {
        vehicleController.addTollFeeToVehicle(licenseNumber, fee, date);
        vehicleController.addTollFeeToVehicle(licenseNumber, fee, date);

        expect(vehicleController.getTollFeesByVehicle(licenseNumber)).toHaveLength(2);
    });

    it('should update toll fee', () => {
        vehicleController.addTollFeeToVehicle(licenseNumber, fee, date);

        const tollFees = vehicleController.getTollFeesByVehicle(licenseNumber);

        vehicleController.updateTollFee(licenseNumber, 13, tollFees[0].id);

        expect(vehicleController.getTollFeesByVehicle(licenseNumber)[0].fee).toBe(13);
    });
});

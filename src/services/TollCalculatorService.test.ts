import TollCalculatorService from './TollCalculatorService';
import HolidayController from '../controllers/HolidayController';
import VehicleController from '../controllers/VehicleController';
import { Vehicle } from '../data/vehicles';

jest.mock('../controllers/HolidayController');
jest.mock('../controllers/VehicleController');

const fetchHolidaysByYearMock = jest.fn().mockResolvedValue([
    { date: '2025-01-01', code: 'newYearsDay' },
    { date: '2025-01-06', code: 'epiphany' },
    { date: '2025-03-29', code: 'goodFriday' },
]);

const getTollFreeVehiclesMock = jest.fn().mockReturnValue(['military', 'diplomat']);

const getVehiclesMock = jest.fn().mockReturnValue([
    {
        licenseNumber: 'ABC123',
        type: 'car',
    },
    {
        licenseNumber: 'DEF456',
        type: 'military',
    },
]);

const getVehicleByLicenseNumberMock = jest
    .fn()
    .mockImplementation((licenseNumber: string) =>
        getVehiclesMock().find((v: Vehicle) => v.licenseNumber === licenseNumber)
    );

const tolledLicenseNumber = 'ABC123';

describe('TollCalculatorService', () => {
    let tollCalculatorService: TollCalculatorService;
    let mockHolidayController: jest.Mocked<HolidayController>;
    let mockVehicleController: jest.Mocked<VehicleController>;

    beforeEach(() => {
        mockHolidayController = {
            fetchHolidaysByYear: fetchHolidaysByYearMock,
        } as unknown as jest.Mocked<HolidayController>;

        mockVehicleController = {
            getVehicles: getVehiclesMock,
            getTollFeesByVehicle: jest.fn(),
            addTollFeeToVehicle: jest.fn(),
            updateTollFee: jest.fn(),
            getTollFreeVehicles: getTollFreeVehiclesMock,
            getVehicleByLicenseNumber: getVehicleByLicenseNumberMock,
        } as unknown as jest.Mocked<VehicleController>;

        tollCalculatorService = new TollCalculatorService(
            mockHolidayController,
            mockVehicleController
        );
    });

    describe('Toll fee calculation', () => {
        beforeEach(() => {
            mockVehicleController.getTollFeesByVehicle.mockReturnValue([]);
            mockVehicleController.getVehicles.mockReturnValue([
                {
                    licenseNumber: 'ABC123',
                    type: 'car',
                },
                {
                    licenseNumber: 'DEF456',
                    type: 'military',
                },
            ]);
        });

        it('Should add new toll fee if no recent toll fees and is within a time slot', async () => {
            const addedDate = new Date('2025-02-04T07:00:00+01:00');
            await tollCalculatorService.registerTollFee(tolledLicenseNumber, addedDate);

            expect(mockVehicleController.addTollFeeToVehicle).toHaveBeenCalledTimes(1);
        });

        it('Should not add toll fee for toll free vehicle', async () => {
            const addedDate = new Date('2025-01-07T08:00:00+01:00');

            await tollCalculatorService.registerTollFee('DEF456', addedDate);

            expect(mockVehicleController.addTollFeeToVehicle).toHaveBeenCalledTimes(0);
        });

        it('Should add toll fee for tolled vehicle', async () => {
            const addedDate = new Date('2025-01-07T08:00:00+01:00');

            await tollCalculatorService.registerTollFee('ABC123', addedDate);

            expect(mockVehicleController.addTollFeeToVehicle).toHaveBeenCalledTimes(1);
        });

        it('Should not add toll fee for tolled vehicle if it is a weekend', async () => {
            const addedDate = new Date('2025-01-12T08:00:00+01:00');

            await tollCalculatorService.registerTollFee('ABC123', addedDate);

            expect(mockVehicleController.addTollFeeToVehicle).toHaveBeenCalledTimes(0);
        });

        it('Should not add toll fee for tolled vehicle if it is a holiday', async () => {
            const addedDate = new Date('2025-01-01T08:00:00+01:00');

            await tollCalculatorService.registerTollFee('ABC123', addedDate);

            expect(mockVehicleController.addTollFeeToVehicle).toHaveBeenCalledTimes(0);
        });

        it('Should add toll fee 13 SEK if it is between 8:00 and 8:30', async () => {
            const addedDate = new Date('2025-01-07T08:25:00+01:00');

            await tollCalculatorService.registerTollFee('ABC123', addedDate);

            expect(mockVehicleController.addTollFeeToVehicle).toHaveBeenCalledWith(
                tolledLicenseNumber,
                13,
                addedDate
            );
        });

        it('Should add toll fee 13 SEK if it is between 15:00 and 15:29', async () => {
            const addedDate = new Date('2025-01-07T15:07:00+01:00');

            await tollCalculatorService.registerTollFee('ABC123', addedDate);

            expect(mockVehicleController.addTollFeeToVehicle).toHaveBeenCalledWith(
                tolledLicenseNumber,
                13,
                addedDate
            );
        });
    });

    describe('Calculate toll fee with pre-existing vehicle fees', () => {
        beforeEach(() => {
            mockVehicleController.getTollFeesByVehicle.mockReturnValue([
                {
                    id: 'some-id-1',
                    fee: 13,
                    date: new Date('2025-02-03T06:02:00+01:00').toISOString(),
                },
                {
                    id: 'some-id-2',
                    fee: 13,
                    date: new Date('2025-02-03T07:00:00+01:00').toISOString(),
                },
            ]);
        });

        it('Should add new toll fee if latest toll is more than one hour old', async () => {
            mockVehicleController.getTollFeesByVehicle.mockReturnValue([
                {
                    fee: 13,
                    date: new Date('2025-02-04T07:00:00+01:00').toISOString(),
                    id: 'some-id-123',
                },
            ]);

            const addedDate = new Date('2025-02-04T08:30:00+01:00');

            await tollCalculatorService.registerTollFee(tolledLicenseNumber, addedDate);

            expect(mockVehicleController.addTollFeeToVehicle).toHaveBeenCalledWith(
                tolledLicenseNumber,
                8,
                addedDate
            );
        });

        it('Should add a new toll fee if new toll is not close in time to other tolls', async () => {
            mockVehicleController.getTollFeesByVehicle.mockReturnValue([
                {
                    id: 'some-id',
                    fee: 13,
                    date: new Date('2025-02-03T06:02:00+01:00').toISOString(),
                },
                {
                    id: 'some-id',
                    fee: 13,
                    date: new Date('2025-02-03T07:00:00+01:00').toISOString(),
                },
            ]);

            const addedDate = new Date('2025-02-03T08:02:00+01:00');

            await tollCalculatorService.registerTollFee(tolledLicenseNumber, addedDate);

            expect(mockVehicleController.addTollFeeToVehicle).toHaveBeenCalledWith(
                tolledLicenseNumber,
                13,
                addedDate
            );
        });

        it('Should update toll fee if new toll is higher and is within 1 hour from recent toll', async () => {
            mockVehicleController.getTollFeesByVehicle.mockReturnValue([
                {
                    fee: 13,
                    date: new Date('2025-02-04T07:00:00+01:00').toISOString(),
                    id: 'some-id-123',
                },
            ]);

            await tollCalculatorService.registerTollFee(
                tolledLicenseNumber,
                new Date('2025-02-04T07:30:00+01:00')
            );

            expect(mockVehicleController.updateTollFee).toHaveBeenCalledWith(
                tolledLicenseNumber,
                18,
                'some-id-123'
            );
        });

        it('Should not update toll fee if new toll is lower than recent toll and is within 1 hour', async () => {
            mockVehicleController.getTollFeesByVehicle.mockReturnValue([
                {
                    fee: 18,
                    date: new Date('2025-02-04T07:00:00+01:00').toISOString(),
                    id: 'some-id-123',
                },
            ]);

            await tollCalculatorService.registerTollFee(
                tolledLicenseNumber,
                new Date('2025-02-04T07:30:00+01:00')
            );

            expect(mockVehicleController.updateTollFee).not.toHaveBeenCalled();
            expect(mockVehicleController.addTollFeeToVehicle).not.toHaveBeenCalled();
        });

        it('Should not add toll fee if it is 0', async () => {
            mockVehicleController.getTollFeesByVehicle.mockReturnValue([]);

            await tollCalculatorService.registerTollFee(
                tolledLicenseNumber,
                new Date('2025-02-04T03:00:00+01:00')
            );

            expect(mockVehicleController.addTollFeeToVehicle).not.toHaveBeenCalled();
        });

        it('Should not add toll fee if vehicle total toll fee is 60 or more for that day', async () => {
            mockVehicleController.getTollFeesByVehicle.mockReturnValue([
                {
                    fee: 30,
                    date: new Date('2025-02-04T07:00:00+01:00').toISOString(),
                    id: 'some-id-123',
                },
                {
                    fee: 30,
                    date: new Date('2025-02-04T07:00:00+01:00').toISOString(),
                    id: 'some-id-123',
                },
            ]);

            await tollCalculatorService.registerTollFee(
                tolledLicenseNumber,
                new Date('2025-02-04T07:00:00+01:00')
            );

            expect(mockVehicleController.addTollFeeToVehicle).not.toHaveBeenCalled();
            expect(mockVehicleController.updateTollFee).not.toHaveBeenCalled();
        });
    });
});

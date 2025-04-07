import express, { Request, Response } from 'express';
import HolidayService from './controllers/HolidayController';
import VehicleService from './controllers/VehicleController';
import TollCalculatorService from './services/TollCalculatorService';

const main = async () => {
    const holidayService = new HolidayService();
    const vehicleService = new VehicleService();
    const tollCalculatorService = new TollCalculatorService(holidayService, vehicleService);

    const app = express();

    app.use(express.json());

    app.get('/toll-fees/:licenseNumber', async (req: Request, res: Response): Promise<void> => {
        const { licenseNumber } = req.params;
        const parsedLicenseNumber = parseLicenseNumber(licenseNumber);

        const tolls = tollCalculatorService.getTollFeesByVehicle(parsedLicenseNumber);

        res.status(200).json({ tolls });
    });

    app.get(
        '/toll-fees/:licenseNumber/total',
        async (req: Request, res: Response): Promise<void> => {
            const { licenseNumber } = req.params;
            const parsedLicenseNumber = parseLicenseNumber(licenseNumber);
            const totalTollFee = tollCalculatorService.getVehicleTotalTollFee(parsedLicenseNumber);

            res.status(200).json({ totalTollFee });
        }
    );

    app.post('/toll-fees', async (req: Request, res: Response): Promise<void> => {
        const { body } = req;
        const { licenseNumber, date } = body;

        const parsedDate = new Date(date);
        const parsedLicenseNumber = parseLicenseNumber(licenseNumber);

        try {
            const tollFee = await tollCalculatorService.registerTollFee(
                parsedLicenseNumber,
                parsedDate
            );
            const message = `Toll fee added to vehicle '${parsedLicenseNumber}'`;

            res.status(200).json({
                message,
                value: tollFee,
            });
        } catch (error) {
            res.status(500).json({ error: 'Something went wrong' });
        }
    });

    app.listen(3001, () => {
        console.log('Server is running on port 3001');
    });
};

const parseLicenseNumber = (licenseNumber: string): string => {
    return licenseNumber.replace(/ /g, '');
};

main();

export type VehicleType =
    | 'car'
    | 'motorcycle'
    | 'tractor'
    | 'emergency'
    | 'diplomat'
    | 'foreign'
    | 'military';
export interface Vehicle {
    type: VehicleType;
    licenseNumber: string;
}

export const tollFreeVehicles: VehicleType[] = ['emergency', 'diplomat', 'foreign', 'military'];

export const vehicles: Vehicle[] = [
    {
        type: 'car',
        licenseNumber: 'ABC123',
    },
    {
        type: 'car',
        licenseNumber: 'DEF456',
    },
    {
        type: 'car',
        licenseNumber: 'GHI789',
    },
    {
        type: 'military',
        licenseNumber: 'JKL012',
    },
    {
        type: 'diplomat',
        licenseNumber: 'MNO345',
    },
    {
        type: 'foreign',
        licenseNumber: 'PQR678',
    },
    {
        type: 'tractor',
        licenseNumber: 'STU901',
    },
    {
        type: 'emergency',
        licenseNumber: 'VWX234',
    },
];

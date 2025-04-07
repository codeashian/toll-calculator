import path from 'path';
import fs from 'fs/promises';

const HOLIDAYS_API_URL = 'https://api.dagsmart.se/holidays';

export type Holidays = Map<number, Holiday[]>;

export type Holiday = {
    date: string;
    code: string;
    name: {
        en: string;
        sv: string;
    };
};

// This class is responsible for fetching the holidays for a year.
// It is responsible for fetching the holidays for a year from the memory cache, file cache or API.
// Future improvements:
// - Use a database instead of a cache
// - Add error handling
export default class HolidayController {
    private memoryCache: Map<number, Holiday[]> = new Map();

    public fetchHolidaysByYear = async (year: number): Promise<Holiday[]> => {
        const holidays = await this.fetchHolidaysFromMemoryCache(year);

        if (holidays) {
            return holidays;
        }

        try {
            return await this.fetchHolidaysFromFileCache(year);
        } catch (error) {
            return this.fetchHolidaysFromApi(year);
        }
    };

    private fetchHolidaysFromMemoryCache = async (year: number): Promise<Holiday[] | undefined> => {
        return this.memoryCache.get(year);
    };

    private fetchHolidaysFromFileCache = async (year: number): Promise<Holiday[]> => {
        const filePath = path.join(__dirname, '..', 'data', 'holidays', `${year}.json`);
        const holidays = await fs.readFile(filePath, 'utf8');
        const normalizedHolidays = normalizeHolidays(JSON.parse(holidays));

        this.memoryCache.set(year, normalizedHolidays);

        return normalizedHolidays;
    };

    private fetchHolidaysFromApi = async (year: number): Promise<Holiday[]> => {
        const response = await fetch(`${HOLIDAYS_API_URL}?year=${year}`);
        const data: any = await response.json();
        const normalizedHolidays = data.map(normalizeHoliday);

        await this.saveToFile(year, normalizedHolidays);
        this.memoryCache.set(year, normalizedHolidays);

        return normalizedHolidays;
    };

    private saveToFile = async (year: number, holidays: Holiday[]): Promise<void> => {
        const filePath = path.join(__dirname, '..', 'data', 'holidays', `${year}.json`);
        await fs.writeFile(filePath, JSON.stringify(holidays, null, 2));
    };
}

const normalizeHolidays = (data: any): Holiday[] => data.map(normalizeHoliday);

const normalizeHoliday = (data: any): Holiday => ({
    date: data.date,
    code: data.code,
    name: data.name,
});

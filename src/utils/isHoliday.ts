import { Holiday } from '../controllers/HolidayController';

const isHoliday = (date: Date, holidays: Holiday[]): boolean => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const day = date.getDate();

    return holidays.some((holiday) => {
        const holidayDate = new Date(holiday.date);
        return (
            holidayDate.getFullYear() === year &&
            holidayDate.getMonth() === month &&
            holidayDate.getDate() === day
        );
    });
};

export default isHoliday;

import { validationError } from '@/utils/errors';
import config from '@/config/config';
// import monthlyScheduleExtract from './monthlySchedule.extarct';
import monthlyScheduleExtract from './monthlySchedule.extract';

export default async function monthyScheduleHandler(c) {
  const today = new Date();
  let dateQuery = c.req.query('date');
  
  // If no date provided, use today's date
  if (!dateQuery) {
      dateQuery = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  }

  let targetYear, targetMonth, targetDay;

  if (/^\d{4}-\d{2}-\d{2}$/.test(dateQuery)) {
      [targetYear, targetMonth, targetDay] = dateQuery.split('-').map(Number);
  } else {
      // Treat as day of current month
      targetYear = today.getFullYear();
      targetMonth = today.getMonth() + 1;
      targetDay = Number(dateQuery);
  }

  const lastDateOfMonth = new Date(targetYear, targetMonth, 0).getDate();

  if (targetDay < 1 || targetDay > lastDateOfMonth) {
      throw new validationError(`Date must be between 1 and ${lastDateOfMonth} for the selected month`);
  }

  const pad = (n) => String(n).padStart(2, '0');
  const formattedDate = `${targetYear}-${pad(targetMonth)}-${pad(targetDay)}`;

  const ajaxUrl = `/ajax/schedule/list?tzOffset=-330&date=${formattedDate}`;

  const meta = {
    date: formattedDate,
    currentDate: `${today.getFullYear()}-${pad(today.getMonth() + 1)}-${pad(today.getDate())}`,
    lastDate: `${targetYear}-${pad(targetMonth)}-${lastDateOfMonth}`,
  };

  try {
    const res = await fetch(config.baseurl + ajaxUrl, {
      headers: {
        ...config.headers,
        Referer: config.baseurl + '/home',
      },
    });

    const data = await res.json();

    const response = monthlyScheduleExtract(data.html);
    return { meta, response };
  } catch (error) {
    console.error(error.message);
    throw new validationError('page not found');
  }
}

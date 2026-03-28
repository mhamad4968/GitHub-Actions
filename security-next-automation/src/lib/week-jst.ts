import dayjs from "dayjs";
import isoWeek from "dayjs/plugin/isoWeek.js";
import timezone from "dayjs/plugin/timezone.js";
import utc from "dayjs/plugin/utc.js";

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(isoWeek);

const TZ = "Asia/Tokyo";

/**
 * ISO 週（月曜始まり）のうち、月〜金の営業日帯を 1 週とみなして JST の範囲を返す
 * （金曜夜のジョブで「今週登録分」を拾う想定）
 */
export function getRunningWeekRangeJst(reference: Date): {
  startInclusive: string;
  endInclusive: string;
  targetWeekMonday: string;
} {
  const start = dayjs(reference).tz(TZ).startOf("isoWeek").hour(0).minute(0).second(0).millisecond(0);
  const end = start.add(4, "day").hour(23).minute(59).second(59).millisecond(999);
  return {
    startInclusive: start.format("YYYY-MM-DDTHH:mm:ssZ"),
    endInclusive: end.format("YYYY-MM-DDTHH:mm:ssZ"),
    targetWeekMonday: start.format("YYYY-MM-DD"),
  };
}

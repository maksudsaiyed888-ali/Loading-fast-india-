import { Router } from "express";

const router = Router();

interface DriverInfo {
  pushToken: string;
  latitude?: number;
  longitude?: number;
  vehicleTypes: string[];
}

interface NotifyBody {
  tripId: string;
  fromLat: number;
  fromLon: number;
  vehicleTypePref: string;
  vyapariName: string;
  fromCity: string;
  toCity: string;
  goodsCategory: string;
  drivers: DriverInfo[];
}

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function getInitialRadius(pref: string): number {
  if (pref === "small") return 20;
  if (pref === "medium") return 30;
  return 50;
}

function filterByRadius(
  drivers: DriverInfo[],
  fromLat: number,
  fromLon: number,
  minKm: number,
  maxKm: number,
  notifiedTokens: Set<string>,
): DriverInfo[] {
  return drivers.filter((d) => {
    if (!d.pushToken || notifiedTokens.has(d.pushToken)) return false;
    if (!d.latitude || !d.longitude) {
      return minKm === 0;
    }
    const dist = haversineKm(fromLat, fromLon, d.latitude, d.longitude);
    return dist >= minKm && dist <= maxKm;
  });
}

async function sendExpoNotifications(
  tokens: string[],
  title: string,
  body: string,
): Promise<void> {
  if (tokens.length === 0) return;
  const messages = tokens.map((to) => ({
    to,
    channelId: "vyapari-trips",
    title,
    body,
    sound: "default",
    priority: "high",
    data: { type: "vyapari_trip" },
  }));
  const chunks: typeof messages[] = [];
  for (let i = 0; i < messages.length; i += 100) {
    chunks.push(messages.slice(i, i + 100));
  }
  await Promise.all(
    chunks.map((chunk) =>
      fetch("https://exp.host/--/api/v2/push/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(chunk),
      }),
    ),
  );
}

router.post("/notify-trip", async (req, res) => {
  const body = req.body as NotifyBody;
  const {
    fromLat, fromLon, vehicleTypePref,
    vyapariName, fromCity, toCity, goodsCategory, drivers,
  } = body;

  const initialRadius = getInitialRadius(vehicleTypePref);
  const notified = new Set<string>();

  const title = `🚛 नई ट्रिप — ${fromCity} → ${toCity}`;
  const msgBody = `${vyapariName} को ${goodsCategory} पहुँचाना है`;

  const zoneA = filterByRadius(drivers, fromLat, fromLon, 0, initialRadius, notified);
  const zoneATokens = zoneA.map((d) => d.pushToken).filter(Boolean);
  await sendExpoNotifications(zoneATokens, `${title} (Zone A)`, msgBody);
  zoneATokens.forEach((t) => notified.add(t));

  setTimeout(async () => {
    const zoneB = filterByRadius(drivers, fromLat, fromLon, initialRadius, initialRadius + 30, notified);
    const zoneBTokens = zoneB.map((d) => d.pushToken).filter(Boolean);
    await sendExpoNotifications(zoneBTokens, `${title} (Zone B)`, `${msgBody} — अभी भी उपलब्ध`);
    zoneBTokens.forEach((t) => notified.add(t));
  }, 10 * 60 * 1000);

  setTimeout(async () => {
    const zoneC = filterByRadius(drivers, fromLat, fromLon, initialRadius + 30, initialRadius + 60, notified);
    const zoneCTokens = zoneC.map((d) => d.pushToken).filter(Boolean);
    await sendExpoNotifications(zoneCTokens, `${title} (Zone C)`, `${msgBody} — तुरंत संपर्क करें`);
  }, 20 * 60 * 1000);

  res.json({ ok: true, zoneA: zoneATokens.length });
});

export default router;

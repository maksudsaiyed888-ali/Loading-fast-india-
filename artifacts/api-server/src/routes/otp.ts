import { Router } from "express";
import crypto from "node:crypto";

const router = Router();

const FIREBASE_PROJECT = "loding-fast";
const FS_BASE = `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT}/databases/(default)/documents`;

const FAST2SMS_KEY = process.env.FAST2SMS_API_KEY ?? "";
const OTP_EXPIRY_MS = 10 * 60 * 1000;
const MAX_ATTEMPTS = 3;
const MAX_ACCOUNTS_PER_PHONE = 2;

function genOtp(): string {
  return String(100000 + (crypto.randomInt(900000)));
}

function hashOtp(otp: string): string {
  return crypto.createHash("sha256").update(otp + "LFI_SALT_2024").digest("hex");
}

function toFsFields(obj: Record<string, unknown>): Record<string, unknown> {
  const f: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj)) {
    if (typeof v === "string") f[k] = { stringValue: v };
    else if (typeof v === "number") f[k] = { integerValue: String(v) };
    else if (typeof v === "boolean") f[k] = { booleanValue: v };
  }
  return f;
}

function parseFsDoc(doc: Record<string, unknown>): Record<string, unknown> {
  const fields = doc.fields as Record<string, Record<string, unknown>> | undefined;
  if (!fields) return {};
  const r: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(fields)) {
    if (v.stringValue !== undefined) r[k] = v.stringValue;
    else if (v.integerValue !== undefined) r[k] = parseInt(v.integerValue as string);
    else if (v.booleanValue !== undefined) r[k] = v.booleanValue;
  }
  return r;
}

async function fsGet(collection: string, docId: string): Promise<Record<string, unknown> | null> {
  const res = await fetch(`${FS_BASE}/${collection}/${encodeURIComponent(docId)}`);
  if (res.status === 404) return null;
  const data = await res.json() as Record<string, unknown>;
  if (data.error) return null;
  return parseFsDoc(data);
}

async function fsSet(collection: string, docId: string, obj: Record<string, unknown>): Promise<void> {
  await fetch(`${FS_BASE}/${collection}/${encodeURIComponent(docId)}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ fields: toFsFields(obj) }),
  });
}

async function fsQuery(collection: string, field: string, value: string): Promise<Record<string, unknown>[]> {
  const body = {
    structuredQuery: {
      from: [{ collectionId: collection }],
      where: {
        fieldFilter: {
          field: { fieldPath: field },
          op: "EQUAL",
          value: { stringValue: value },
        },
      },
      limit: 5,
    },
  };
  const res = await fetch(`${FS_BASE}:runQuery`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const rows = await res.json() as Array<{ document?: Record<string, unknown> }>;
  return rows.filter((r) => r.document).map((r) => parseFsDoc(r.document!));
}

async function sendSms(phone: string, otp: string): Promise<boolean> {
  if (!FAST2SMS_KEY) return false;
  try {
    const res = await fetch("https://www.fast2sms.com/dev/bulkV2", {
      method: "POST",
      headers: {
        authorization: FAST2SMS_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        variables_values: otp,
        route: "otp",
        numbers: phone,
      }),
    });
    const data = await res.json() as { return?: boolean; message?: string };
    return data.return === true;
  } catch {
    return false;
  }
}

router.post("/otp/send", async (req, res) => {
  try {
    const { phone, role } = req.body as { phone?: string; role?: string };

    if (!phone || !/^\d{10}$/.test(phone)) {
      return res.status(400).json({ success: false, error: "10 अंकों का मोबाइल नंबर दर्ज करें" });
    }
    if (!role || !["driver", "vyapari"].includes(role)) {
      return res.status(400).json({ success: false, error: "Invalid role" });
    }

    const collection = role === "driver" ? "drivers" : "vyaparis";
    const users = await fsQuery(collection, "phone", phone);
    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        errorCode: "not_registered",
        error: "इस नंबर से कोई खाता नहीं है। पहले रजिस्ट्रेशन करें।",
      });
    }

    const otp = genOtp();
    const otpHash = hashOtp(otp);
    const now = new Date();
    const expiresAt = new Date(now.getTime() + OTP_EXPIRY_MS);
    const docId = `${phone}_${role}`;

    const smsSent = await sendSms(phone, otp);

    await fsSet("loginOtps", docId, {
      phone,
      role,
      otpHash,
      createdAt: now.toISOString(),
      expiresAt: expiresAt.toISOString(),
      attempts: 0,
      verified: false,
      pendingVerification: !smsSent,
    });

    if (smsSent) {
      return res.json({ success: true, smsSent: true });
    } else {
      return res.json({ success: true, smsSent: false, pendingVerification: true });
    }
  } catch (err) {
    console.error("OTP send error:", err);
    return res.status(500).json({ success: false, error: "Server error" });
  }
});

router.post("/otp/verify", async (req, res) => {
  try {
    const { phone, otp, role } = req.body as { phone?: string; otp?: string; role?: string };

    if (!phone || !otp || !role) {
      return res.status(400).json({ success: false, error: "Missing fields" });
    }

    const docId = `${phone}_${role}`;
    const record = await fsGet("loginOtps", docId);

    if (!record) {
      return res.status(400).json({ success: false, error: "OTP नहीं मिला। नया OTP लें।" });
    }

    const expiresAt = new Date(record.expiresAt as string);
    if (new Date() > expiresAt) {
      return res.status(400).json({ success: false, errorCode: "expired", error: "OTP expire हो गया। नया OTP लें।" });
    }

    const attempts = (record.attempts as number) || 0;
    if (attempts >= MAX_ATTEMPTS) {
      return res.status(429).json({ success: false, errorCode: "too_many", error: "बहुत ज्यादा गलत कोशिश। नया OTP लें।" });
    }

    const inputHash = hashOtp(otp);
    if (inputHash !== record.otpHash) {
      await fsSet("loginOtps", docId, { ...record, attempts: attempts + 1 });
      const remaining = MAX_ATTEMPTS - (attempts + 1);
      return res.status(400).json({
        success: false,
        errorCode: "wrong_otp",
        error: `गलत OTP। ${remaining > 0 ? `${remaining} कोशिश बाकी` : "अब नया OTP लें"}।`,
      });
    }

    const collection = role === "driver" ? "drivers" : "vyaparis";
    const users = await fsQuery(collection, "phone", phone);
    if (users.length === 0) {
      return res.status(404).json({ success: false, error: "User not found" });
    }

    const user = users[0];
    await fsSet("loginOtps", docId, {
      phone,
      role: role as string,
      otpHash: "",
      createdAt: record.createdAt as string,
      expiresAt: record.expiresAt as string,
      attempts: 0,
      verified: true,
    });

    return res.json({
      success: true,
      user: {
        id: user.id as string,
        name: user.name as string,
        phone: user.phone as string,
        email: (user.email as string) ?? "",
      },
    });
  } catch (err) {
    console.error("OTP verify error:", err);
    return res.status(500).json({ success: false, error: "Server error" });
  }
});

router.post("/otp/check-phone", async (req, res) => {
  try {
    const { phone } = req.body as { phone?: string };
    if (!phone || !/^\d{10}$/.test(phone)) {
      return res.status(400).json({ success: false, error: "Invalid phone" });
    }

    const [drivers, vyaparis] = await Promise.all([
      fsQuery("drivers", "phone", phone),
      fsQuery("vyaparis", "phone", phone),
    ]);
    const total = drivers.length + vyaparis.length;

    return res.json({
      success: true,
      accountCount: total,
      canRegister: total < MAX_ACCOUNTS_PER_PHONE,
      driverAccounts: drivers.length,
      vyapariAccounts: vyaparis.length,
    });
  } catch (err) {
    console.error("Check phone error:", err);
    return res.status(500).json({ success: false, error: "Server error" });
  }
});

export default router;

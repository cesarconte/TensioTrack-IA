import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { PrismaClient } from "@prisma/client";
import pino from "pino";

const logger = pino();
const prisma = new PrismaClient();
const app = express();
const PORT = 3000;

app.use(express.json());

// API Routes
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Readings API
app.get("/api/readings", async (req, res) => {
  try {
    const readings = await prisma.reading.findMany({
      orderBy: { recordedAt: 'desc' },
      include: { session: true }
    });
    res.json(readings);
  } catch (error) {
    logger.error(error);
    res.status(500).json({ error: "Failed to fetch readings" });
  }
});

app.post("/api/readings", async (req, res) => {
  const { systolic, diastolic, heartRate, slot, date } = req.body;
  try {
    // Logic to find or create Day and Session
    const targetDate = new Date(date || new Date());
    targetDate.setHours(0, 0, 0, 0);

    let day = await prisma.day.findUnique({ where: { date: targetDate } });
    if (!day) {
      day = await prisma.day.create({ data: { date: targetDate } });
    }

    let session = await prisma.session.findFirst({
      where: { dayId: day.id, slot }
    });
    if (!session) {
      session = await prisma.session.create({
        data: { dayId: day.id, slot }
      });
    }

    const readingsCount = await prisma.reading.count({
      where: { sessionId: session.id }
    });

    if (readingsCount >= 3) {
      return res.status(400).json({ error: "Session already has 3 readings" });
    }

    const reading = await prisma.reading.create({
      data: {
        systolic,
        diastolic,
        heartRate,
        order: readingsCount + 1,
        sessionId: session.id
      }
    });

    // Update session averages if complete
    if (readingsCount + 1 === 3) {
      const allReadings = await prisma.reading.findMany({
        where: { sessionId: session.id }
      });
      const avgSys = allReadings.reduce((acc, r) => acc + r.systolic, 0) / 3;
      const avgDia = allReadings.reduce((acc, r) => acc + r.diastolic, 0) / 3;
      
      await prisma.session.update({
        where: { id: session.id },
        data: {
          avgSystolic: Math.round(avgSys * 10) / 10,
          avgDiastolic: Math.round(avgDia * 10) / 10,
          completedAt: new Date()
        }
      });

      // Check if day is complete to update day averages
      const otherSession = await prisma.session.findFirst({
        where: { dayId: day.id, NOT: { id: session.id } }
      });

      if (otherSession && otherSession.avgSystolic) {
        const dayAvgSys = (avgSys + otherSession.avgSystolic) / 2;
        const dayAvgDia = (avgDia + otherSession.avgDiastolic) / 2;
        await prisma.day.update({
          where: { id: day.id },
          data: {
            avgSystolic: Math.round(dayAvgSys * 10) / 10,
            avgDiastolic: Math.round(dayAvgDia * 10) / 10
          }
        });
      }
    }

    res.json(reading);
  } catch (error) {
    logger.error(error);
    res.status(500).json({ error: "Failed to create reading" });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    logger.info(`Server running on http://localhost:${PORT}`);
  });
}

startServer();

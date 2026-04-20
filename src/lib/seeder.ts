import { collection, writeBatch, doc, Timestamp, getDocs } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { getISOWeek } from './utils';

// Helper for generating random numbers within a range
const rand = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;

// Generate realistic date strings and timestamps
const generateDatesForPeriod = (periodIndex: number) => {
  // We want to generate periods going backward from this week.
  // Period 6 is current week (Monday to Friday)
  const today = new Date();
  
  // Calculate the Monday of the current week
  const day = today.getDay();
  const diff = today.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
  const currentMonday = new Date(today.setDate(diff));
  
  // Period index goes from 1 to 6. Period 6 is current week.
  const weeksAgo = 6 - periodIndex;
  
  const periodMonday = new Date(currentMonday);
  periodMonday.setDate(periodMonday.getDate() - (weeksAgo * 7));

  const days = [];
  for (let i = 0; i < 5; i++) { // Monday to Friday
    const d = new Date(periodMonday);
    d.setDate(d.getDate() + i);
    days.push(d);
  }
  return days;
};

// Target ranges based on period to create variety
const getRanges = (periodId: number) => {
  switch (periodId) {
    case 1: // Normal-Alta
      return { sys: [130, 139], dia: [85, 89], hr: [70, 85] };
    case 2: // Hipertensión
      return { sys: [140, 155], dia: [90, 99], hr: [80, 95] };
    case 3: // Baja
      return { sys: [90, 105], dia: [55, 65], hr: [50, 60] };
    case 4: // Normal
      return { sys: [110, 125], dia: [70, 80], hr: [60, 75] };
    case 5: // Normal
      return { sys: [115, 128], dia: [75, 82], hr: [65, 80] };
    case 6: // Normal (Current)
      return { sys: [118, 126], dia: [78, 83], hr: [68, 78] };
    default:
      return { sys: [110, 120], dia: [70, 80], hr: [60, 80] };
  }
};

const getRandomInsight = () => {
  const insights = [
    { category: 'sueño', notes: ['He dormido muy mal esta noche, me desperté varias veces.', 'Dormí del tirón pero me siento cansado.', 'No pude conciliar el sueño hasta tarde.'] },
    { category: 'estrés', notes: ['Día complicado en el trabajo.', 'Algo de ansiedad por la mañana.', 'Me siento un poco agobiado hoy.'] },
    { category: 'medicación', notes: ['Tomé la pastilla a la hora de siempre.', 'Me tomé el enalapril media hora tarde.', 'Se me olvidó la medicación de la cena de ayer.'] },
    { category: 'dieta', notes: ['Cena algo pesada ayer.', 'Comí con un poco más de sal de lo normal.', 'He tomado mucha agua hoy.'] },
    { category: 'ejercicio', notes: ['Caminata de 40 mins antes de la toma.', 'Me siento activo, hice estiramientos suaves.', 'Paseo largo por la tarde.'] },
    { category: 'alcohol/tabaco', notes: ['Tomé una copa de vino en la cena.', 'Fumé un par de ojitos ayer por la tarde.', 'Ayer salí y tomé un par de cervezas.'] },
    { category: 'otro', notes: ['Me siento normal hoy.', 'Todo bajo control.', 'Ligero dolor de cabeza al levantarme.', 'Un poco mareado hoy.'] }
  ];
  
  const selectedCat = insights[rand(0, insights.length - 1)];
  const selectedNote = selectedCat.notes[rand(0, selectedCat.notes.length - 1)];
  
  return { category: selectedCat.category, notes: selectedNote };
};

export const seedClinicalData = async () => {
  if (!auth.currentUser) throw new Error('User not authenticated');
  const uid = auth.currentUser.uid;
  const readingsRef = collection(db, 'users', uid, 'readings');

  // Step 1: Clear existing data for a clean slate
  const snapshot = await getDocs(readingsRef);
  let batch = writeBatch(db);
  let deleteCount = 0;
  
  snapshot.docs.forEach(d => {
    batch.delete(d.ref);
    deleteCount++;
  });
  if (deleteCount > 0) {
    await batch.commit();
  }

  // Step 2: Generate mock data
  let opCount = 0;
  batch = writeBatch(db);

  for (let periodId = 1; periodId <= 6; periodId++) {
    const days = generateDatesForPeriod(periodId);
    const ranges = getRanges(periodId);

    days.forEach((dateObj) => {
      const dateStr = dateObj.toISOString().split('T')[0];
      const weekId = getISOWeek(dateStr);

      // Morning slot (around 08:00 AM)
      for (let order = 1; order <= 3; order++) {
        const sys = rand(ranges.sys[0], ranges.sys[1]);
        const dia = rand(ranges.dia[0], ranges.dia[1]);
        const hr = rand(ranges.hr[0], ranges.hr[1]);
        
        const recordedAt = new Date(dateObj);
        recordedAt.setHours(8, order * 2, 0, 0); // 08:02, 08:04, 08:06

        const { category, notes } = getRandomInsight();

        const ref = doc(readingsRef);
        batch.set(ref, {
          systolic: sys,
          diastolic: dia,
          heartRate: hr,
          order,
          slot: 'morning',
          date: dateStr,
          notes: notes,
          category: category,
          recordedAt: Timestamp.fromDate(recordedAt),
          userUid: uid,
          periodId,
          weekId
        });
        opCount++;
      }

      // Evening slot (around 20:00 PM)
      for (let order = 1; order <= 3; order++) {
        const sys = rand(ranges.sys[0], ranges.sys[1]);
        const dia = rand(ranges.dia[0], ranges.dia[1]);
        const hr = rand(ranges.hr[0], ranges.hr[1]);
        
        const recordedAt = new Date(dateObj);
        recordedAt.setHours(20, order * 2, 0, 0); // 20:02, 20:04, 20:06

        const { category, notes } = getRandomInsight();

        const ref = doc(readingsRef);
        batch.set(ref, {
          systolic: sys,
          diastolic: dia,
          heartRate: hr,
          order,
          slot: 'evening',
          date: dateStr,
          notes: notes,
          category: category,
          recordedAt: Timestamp.fromDate(recordedAt),
          userUid: uid,
          periodId,
          weekId
        });
        opCount++;
      }
    });

    // Commit when batch is getting large to avoid Firestore limits (500)
    if (opCount > 300) {
      await batch.commit();
      batch = writeBatch(db);
      opCount = 0;
    }
  }

  // Final commit for any remaining operations
  if (opCount > 0) {
    await batch.commit();
  }
};

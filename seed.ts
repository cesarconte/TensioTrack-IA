import { db, auth, collection, doc, writeBatch, Timestamp } from './src/firebase';

async function seedData() {
  if (!auth.currentUser) {
    console.error('Debes estar autenticado para sembrar datos.');
    return;
  }

  const userId = auth.currentUser.uid;
  const readingsRef = collection(db, 'users', userId, 'readings');
  
  // Períodos de 5 días cada uno siguiendo la lógica del prompt (20 días total = 4 períodos)
  const periods = [
    { id: 1, startDate: '2026-03-01' },
    { id: 2, startDate: '2026-03-06' },
    { id: 3, startDate: '2026-03-11' },
    { id: 4, startDate: '2026-03-16' }
  ];

  console.log(`Sembrando datos para el usuario: ${userId}`);

  for (const period of periods) {
    const batch = writeBatch(db);
    console.log(`Generando Período ${period.id}...`);

    for (let dayOffset = 0; dayOffset < 5; dayOffset++) {
      const currentDate = new Date(period.startDate);
      currentDate.setDate(currentDate.getDate() + dayOffset);
      const dateString = currentDate.toISOString().split('T')[0];
      
      // Calcular weekId (ISO 8601)
      const d = new Date(currentDate);
      d.setHours(0, 0, 0, 0);
      d.setDate(d.getDate() + 4 - (d.getDay() || 7));
      const year = d.getFullYear();
      const week = Math.ceil((((d.getTime() - new Date(year, 0, 1).getTime()) / 86400000) + 1) / 7);
      const weekId = `${year}-W${week.toString().padStart(2, '0')}`;

      // 6 lecturas por día (3 mañana, 3 noche)
      const slots = ['morning', 'evening'];
      
      for (const slot of slots) {
        for (let order = 1; order <= 3; order++) {
          const newDocRef = doc(readingsRef);
          
          // Generar valores realistas con algo de variabilidad
          const baseSys = period.id % 2 === 0 ? 115 : 125;
          const baseDia = period.id % 2 === 0 ? 75 : 82;
          
          const reading = {
            systolic: baseSys + Math.floor(Math.random() * 10),
            diastolic: baseDia + Math.floor(Math.random() * 8),
            heartRate: 65 + Math.floor(Math.random() * 15),
            slot,
            order,
            date: dateString,
            recordedAt: Timestamp.fromDate(new Date(`${dateString}T${slot === 'morning' ? '08' : '20'}:00:00Z`)),
            notes: `Registro de prueba del periodo ${period.id}`,
            category: 'reposo',
            userUid: userId,
            periodId: period.id,
            weekId: weekId
          };
          
          batch.set(newDocRef, reading);
        }
      }
    }
    
    await batch.commit();
    console.log(`Período ${period.id} completado (30 lecturas).`);
  }

  console.log('Sembrado de datos finalizado con éxito.');
}

// Para ejecutarlo puedes llamarlo desde la consola del navegador si adjuntas esta función a window
(window as any).seedTensioTrack = seedData;
console.log('Función seatTensioTrack disponible en window. Ejecútala en la consola.');

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Iniciando seed...");

  // ─────────────────────────────────────────
  // EJERCICIOS
  // ─────────────────────────────────────────
  const exercisesData = [
    // Cuádriceps / Abductores
    { name: "Sentadilla libre", muscleGroup: "Cuádriceps" },
    { name: "Sentadilla búlgara", muscleGroup: "Cuádriceps" },
    { name: "Extensiones de cuádriceps", muscleGroup: "Cuádriceps" },
    { name: "Sentadilla sumo", muscleGroup: "Cuádriceps" },
    { name: "Sentadilla lateral", muscleGroup: "Cuádriceps" },
    { name: "Prensa", muscleGroup: "Cuádriceps" },
    { name: "Abducción en polea", muscleGroup: "Cuádriceps" },
    // Pecho / Espalda
    { name: "Jalón al pecho", muscleGroup: "Espalda" },
    { name: "Pull over", muscleGroup: "Espalda" },
    { name: "Remo en polea baja (sentado)", muscleGroup: "Espalda" },
    { name: "Press plano", muscleGroup: "Pecho" },
    { name: "Press inclinado", muscleGroup: "Pecho" },
    { name: "Aperturas en polea (banco inclinado)", muscleGroup: "Pecho" },
    { name: "Press banca", muscleGroup: "Pecho" },
    { name: "Jalón en polea", muscleGroup: "Espalda" },
    { name: "Jalón individual para dorsales", muscleGroup: "Espalda" },
    { name: "Máquina para densidad de espalda", muscleGroup: "Espalda" },
    // Brazos / Hombros
    { name: "Vuelos laterales", muscleGroup: "Hombros" },
    { name: "Press militar", muscleGroup: "Hombros" },
    { name: "Curl martillo", muscleGroup: "Bíceps" },
    { name: "Curl griego", muscleGroup: "Bíceps" },
    { name: "Curl griego (banco inclinado)", muscleGroup: "Bíceps" },
    { name: "Curl con barra W", muscleGroup: "Bíceps" },
    { name: "Press francés", muscleGroup: "Tríceps" },
    { name: "Variante press francés en polea", muscleGroup: "Tríceps" },
    { name: "Extensión inversa de tríceps", muscleGroup: "Tríceps" },
    // Isquios / Glúteos
    { name: "Hip thrust", muscleGroup: "Glúteos" },
    { name: "Peso muerto", muscleGroup: "Isquiotibiales" },
    { name: "Máquina de isquiotibiales", muscleGroup: "Isquiotibiales" },
    { name: "Declinado de glúteos", muscleGroup: "Glúteos" },
    { name: "Patada en polea con banco", muscleGroup: "Glúteos" },
    { name: "Patada en polea", muscleGroup: "Glúteos" },
    { name: "Sentadilla explosiva", muscleGroup: "Cuádriceps" },
  ];

  console.log("📦 Creando ejercicios...");
  const exercises: Record<string, string> = {};

  for (const ex of exercisesData) {
    const created = await prisma.exercise.create({ data: ex });
    exercises[ex.name] = created.id;
  }

  // Helper para obtener id por nombre
  const ex = (name: string) => {
    const id = exercises[name];
    if (!id) throw new Error(`Ejercicio no encontrado: ${name}`);
    return id;
  };

  // ─────────────────────────────────────────
  // RUTINA HOMBRES
  // ─────────────────────────────────────────
  console.log("💪 Creando rutina de hombres...");

  const rutinaHombres = await prisma.routine.create({
    data: {
      name: "Rutina Fuerza Masculina - 5 días",
      description:
        "Rutina de fuerza e hipertrofia para hombres, 5 días a la semana.",
      category: "Hombres",
    },
  });

  const diasHombres = [
    {
      dayNumber: 1,
      dayName: "Cuádriceps y Abductores",
      exercises: [
        { name: "Sentadilla libre", sets: 4, reps: "10" },
        { name: "Sentadilla búlgara", sets: 3, reps: "10" },
        { name: "Extensiones de cuádriceps", sets: 3, reps: "12" },
        { name: "Sentadilla sumo", sets: 3, reps: "10" },
        { name: "Sentadilla lateral", sets: 3, reps: "12" },
      ],
    },
    {
      dayNumber: 2,
      dayName: "Pecho y Espalda",
      exercises: [
        { name: "Jalón al pecho", sets: 4, reps: "10" },
        { name: "Pull over", sets: 3, reps: "12" },
        { name: "Remo en polea baja (sentado)", sets: 3, reps: "10" },
        { name: "Press plano", sets: 4, reps: "10" },
        { name: "Press inclinado", sets: 3, reps: "10" },
        { name: "Aperturas en polea (banco inclinado)", sets: 3, reps: "12" },
      ],
    },
    {
      dayNumber: 3,
      dayName: "Brazos Completo",
      exercises: [
        { name: "Vuelos laterales", sets: 3, reps: "15" },
        { name: "Press militar", sets: 4, reps: "10" },
        { name: "Curl martillo", sets: 3, reps: "12" },
        { name: "Curl griego", sets: 3, reps: "10" },
        { name: "Press francés", sets: 3, reps: "12" },
        { name: "Extensión inversa de tríceps", sets: 3, reps: "12" },
      ],
    },
    {
      dayNumber: 4,
      dayName: "Isquios y Glúteos",
      exercises: [
        { name: "Sentadilla libre", sets: 4, reps: "10" },
        { name: "Hip thrust", sets: 4, reps: "12" },
        { name: "Sentadilla búlgara", sets: 3, reps: "10" },
        { name: "Peso muerto", sets: 3, reps: "8" },
        { name: "Máquina de isquiotibiales", sets: 3, reps: "12" },
      ],
    },
    {
      dayNumber: 5,
      dayName: "Pecho y Espalda",
      exercises: [
        { name: "Jalón al pecho", sets: 4, reps: "10" },
        { name: "Pull over", sets: 3, reps: "12" },
        { name: "Remo en polea baja (sentado)", sets: 3, reps: "10" },
        { name: "Press plano", sets: 4, reps: "10" },
        { name: "Press inclinado", sets: 3, reps: "10" },
        { name: "Aperturas en polea (banco inclinado)", sets: 3, reps: "12" },
      ],
    },
  ];

  for (const dia of diasHombres) {
    const routineDay = await prisma.routineDay.create({
      data: {
        routineId: rutinaHombres.id,
        dayNumber: dia.dayNumber,
        dayName: dia.dayName,
      },
    });

    for (let i = 0; i < dia.exercises.length; i++) {
      const e = dia.exercises[i];
      await prisma.routineExercise.create({
        data: {
          routineDayId: routineDay.id,
          exerciseId: ex(e.name),
          sets: e.sets,
          reps: e.reps,
          restSeconds: 60,
          orderIndex: i + 1,
        },
      });
    }
  }

  // ─────────────────────────────────────────
  // RUTINA MUJERES
  // ─────────────────────────────────────────
  console.log("🌸 Creando rutina de mujeres...");

  const rutinaMujeres = await prisma.routine.create({
    data: {
      name: "Rutina Femenina Glúteos y Definición - 5 días",
      description:
        "Rutina de tonificación y glúteos para mujeres, 5 días a la semana.",
      category: "Mujeres",
    },
  });

  const diasMujeres = [
    {
      dayNumber: 1,
      dayName: "Cuádriceps y Abductores",
      exercises: [
        { name: "Sentadilla libre", sets: 4, reps: "10" },
        { name: "Sentadilla búlgara", sets: 3, reps: "10" },
        { name: "Prensa", sets: 3, reps: "12" },
        { name: "Sentadilla sumo", sets: 3, reps: "12" },
        { name: "Abducción en polea", sets: 3, reps: "15" },
      ],
    },
    {
      dayNumber: 2,
      dayName: "Pecho y Tríceps",
      exercises: [
        { name: "Press banca", sets: 4, reps: "10" },
        { name: "Press inclinado", sets: 3, reps: "10" },
        { name: "Jalón en polea", sets: 3, reps: "12" },
        { name: "Press francés", sets: 3, reps: "12" },
        { name: "Variante press francés en polea", sets: 3, reps: "12" },
        { name: "Extensión inversa de tríceps", sets: 3, reps: "12" },
      ],
    },
    {
      dayNumber: 3,
      dayName: "Glúteos e Isquios",
      exercises: [
        { name: "Hip thrust", sets: 4, reps: "12" },
        { name: "Patada en polea con banco", sets: 3, reps: "15" },
        { name: "Peso muerto", sets: 3, reps: "10" },
        { name: "Declinado de glúteos", sets: 3, reps: "12" },
        { name: "Máquina de isquiotibiales", sets: 3, reps: "12" },
      ],
    },
    {
      dayNumber: 4,
      dayName: "Espalda y Bíceps",
      exercises: [
        { name: "Jalón al pecho", sets: 4, reps: "10" },
        { name: "Jalón individual para dorsales", sets: 3, reps: "12" },
        { name: "Máquina para densidad de espalda", sets: 3, reps: "12" },
        { name: "Curl martillo", sets: 3, reps: "12" },
        { name: "Curl con barra W", sets: 3, reps: "10" },
        { name: "Curl griego (banco inclinado)", sets: 3, reps: "10" },
      ],
    },
    {
      dayNumber: 5,
      dayName: "Pierna Completa",
      exercises: [
        { name: "Sentadilla libre", sets: 4, reps: "10" },
        { name: "Extensiones de cuádriceps", sets: 3, reps: "12" },
        { name: "Sentadilla búlgara", sets: 3, reps: "10" },
        { name: "Sentadilla explosiva", sets: 3, reps: "10" },
        { name: "Hip thrust", sets: 3, reps: "12" },
        { name: "Patada en polea", sets: 3, reps: "15" },
        { name: "Peso muerto", sets: 3, reps: "10" },
      ],
    },
  ];

  for (const dia of diasMujeres) {
    const routineDay = await prisma.routineDay.create({
      data: {
        routineId: rutinaMujeres.id,
        dayNumber: dia.dayNumber,
        dayName: dia.dayName,
      },
    });

    for (let i = 0; i < dia.exercises.length; i++) {
      const e = dia.exercises[i];
      await prisma.routineExercise.create({
        data: {
          routineDayId: routineDay.id,
          exerciseId: ex(e.name),
          sets: e.sets,
          reps: e.reps,
          restSeconds: 60,
          orderIndex: i + 1,
        },
      });
    }
  }

  console.log("✅ Seed completado!");
  console.log(`   - ${exercisesData.length} ejercicios creados`);
  console.log(`   - Rutina hombres: "${rutinaHombres.name}"`);
  console.log(`   - Rutina mujeres: "${rutinaMujeres.name}"`);
}

main()
  .catch((e) => {
    console.error("❌ Error en seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

const { generatePremiumWorkout } = require("../src/services/workoutEngine");

describe("premium workout plans", () => {
  it.each([2, 3])("returns a low-impact %i-day plan", (days) => {
    const plan = generatePremiumWorkout(days);
    const exercises = plan.schedule.flatMap((day) => day.exercises);

    expect(plan.schedule).toHaveLength(days);
    expect(exercises.length).toBeGreaterThan(0);
    expect(
      `${plan.type} ${plan.description} ${exercises
        .map((exercise) => `${exercise.name} ${exercise.form}`)
        .join(" ")}`,
    ).not.toMatch(/maksimum|eksploz|skok|krv|NFL|pakao/i);
    expect(plan.description).toMatch(/prekini ako osetiš bol/i);
  });
});

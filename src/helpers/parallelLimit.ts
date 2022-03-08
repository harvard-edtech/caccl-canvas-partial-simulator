/**
 * Run functions in parallel
 * @author Gabe Abrams
 */
const parallelLimit = async (
  tasks: (() => Promise<unknown>)[],
  limit: number,
): Promise<any[]> => {
  // Create promise chains with width = limit
  const results: any[] = new Array(tasks.length);
  const promiseChains: any[] = new Array(tasks.length);
  // Fill with initial promises
  for (let i = 0; i < limit; i++) {
    promiseChains[i] = Promise.resolve();
  }
  // Chain up all promises
  tasks.forEach((task, i) => {
    promiseChains[i % limit] = promiseChains[i % limit].then(() => {
      return task().then((result) => {
        results[i] = result;
      });
    });
  });
  // Wait for promises to finish
  await Promise.all(promiseChains);

  // Return results
  return results;
};

export default parallelLimit;

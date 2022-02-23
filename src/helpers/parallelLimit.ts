import async from 'async';

/**
 * Run functions in parallel
 * @author Gabe Abrams
 */
const parallelLimit = async (
  tasks: (() => Promise<unknown>)[],
  limit: number,
): Promise<any[]> => {
  const modifiedTasks = tasks.map((task) => {
    return (next: Function) => {
      task()
        .then((results) => {
          next(null, results);
        })
        .catch((err) => {
          next(err);
        });
    };
  });
  return new Promise((resolve, reject) => {
    async.parallelLimit(
      modifiedTasks,
      limit,
      (err, results) => {
        if (err) {
          reject(err);
        } else {
          resolve(results);
        }
      }
    )
  });
};

export default parallelLimit;

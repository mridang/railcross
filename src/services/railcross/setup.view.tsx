/**
 * @file Setup page that lists repositories with their lock and unlock times and a form to change them.
 */
import { render } from '@mridang/nestjs-defaults';
import type { FunctionalComponent } from '@mridang/nestjs-defaults';

const SetupView: FunctionalComponent<{
  schedules: {
    installationId: number;
    repoId: number;
    repoName: string;
    lockTime?: string;
    unlockTime?: string;
  }[];
}> = ({ schedules }) => {
  return (
    <html lang="en">
      <head>
        <link rel="icon" type="image/x-icon" href="/static/favicon.ico" />
        <meta charset="utf-8" />
        <meta name="robots" content="noindex, nofollow" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>Log in</title>
        <meta name="robots" content="noindex, nofollow" />
        <script src="/static/js/tailwind.3.4.5.js"></script>
      </head>
      <body>
        <div className="h-screen w-screen bg-gray-400">
          <form action="/app/setup" method="post">
            <label htmlFor="lock-time">Lock Time:</label>
            <input
              type="time"
              name="lock_time"
              id="lock-time"
              step={3600}
              required
            />

            <label htmlFor="unlock-time">Unlock Time:</label>
            <input
              type="time"
              name="unlock_time"
              id="unlock-time"
              step={3600}
              required
            />
            <label htmlFor="timezone">Timezone:</label>
            <select name="timezone" id="timezone">
              {Intl.supportedValuesOf('timeZone').map((timezone) => (
                <option key={timezone} value={timezone}>
                  {timezone}
                </option>
              ))}
            </select>
            <button type="submit">Submit</button>
            <table>
              <thead>
                <tr>
                  <th></th>
                  <th>Repository Name</th>
                  <th>Lock Time</th>
                  <th>Unlock Time</th>
                </tr>
              </thead>
              <tbody>
                {schedules.map((schedule) => (
                  <tr key={schedule.repoId}>
                    <td>
                      <input
                        name="repo_ids[]"
                        id={schedule.repoId.toString()}
                        type="checkbox"
                        value={schedule.repoId}
                      />
                    </td>
                    <td>{schedule.repoName}</td>
                    <td>{schedule.lockTime}</td>
                    <td>{schedule.unlockTime}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </form>
          <form action="/app/reset" method="post">
            <button type="submit">Delete</button>
          </form>
        </div>
      </body>
    </html>
  );
};

/**
 * Renders the setup page for the given repository schedules.
 * @param schedules - The repositories to list, each with its optional lock and unlock times.
 * @returns The rendered page markup.
 * @example
 * ```ts
 * renderSetupPage([{ installationId: 1, repoId: 2, repoName: 'octo/repo', lockTime: 'cron(0 7 ? * * *) Europe/London' }]);
 * ```
 */
const renderSetupPage = (
  schedules: {
    installationId: number;
    repoId: number;
    repoName: string;
    lockTime?: string;
    unlockTime?: string;
  }[],
) => render(<SetupView schedules={schedules} />);

export default renderSetupPage;

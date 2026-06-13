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
        <meta charset="UTF-8" />
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
            <select name="lock_time" id="lock-time">
              {Array.from({ length: 24 }, (_, hour) => (
                <option key={hour} value={hour}>
                  {hour.toString().padStart(2, '0')}:00
                </option>
              ))}
            </select>

            <label htmlFor="unlock-time">Unlock Time:</label>
            <select name="unlock_time" id="unlock-time">
              {Array.from({ length: 24 }, (_, hour) => (
                <option key={hour} value={hour}>
                  {hour.toString().padStart(2, '0')}:00
                </option>
              ))}
            </select>
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

export default (
  schedules: {
    installationId: number;
    repoId: number;
    repoName: string;
    lockTime?: string;
    unlockTime?: string;
  }[],
) => render(<SetupView schedules={schedules} />);

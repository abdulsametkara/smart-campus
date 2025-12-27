# Project Retrospective

## What Went Well
- **Micro-service Readiness:** The modular controller/service structure made adding new features (like IoT) very easy without breaking existing code.
- **Socket.io Integration:** Adding real-time notifications was straightforward thanks to the centralized `notificationHelper` utility.
- **Dockerization:** Deployment is seamless; `docker-compose up` is all that's needed.

## Challenges Faced
- **Migration Dependency:** Early on, some migrations failed due to table creation order. We fixed this by strictly ordering timestamps and using foreign key constraints carefully.
- **Test Data Cleanup:** Integration tests for "Meals" failed due to cascading deletes. We learned to manually clean up child records (Transactions, Reservations) before deleting Parents (Users).
- **PowerShell vs Bash:** Configuring scripts for both OSs took extra time (solved with `DEPLOY_WIN.bat`).

## Lessons Learned
- **Tests are critical:** The test suite caught multiple regressions during the Part 4 refactor.
- **Documentation First:** Writing `implementation_plan.md` saved hours of aimless coding.
- **Real-time UX:** Users expect instant feedback; WebSockets are essential for modern apps.

## Future Improvements
- **Micro-services:** Split the monolithic backend into separate containers (Auth Service, core Service).
- **Mobile App:** Build a React Native app re-using the existing API.
- **Redis Caching:** Implement Redis for leaderboards and high-frequency analytics endpoints.

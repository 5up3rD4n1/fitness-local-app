# The fitness single page app

This is mobile REACT single page app, that is going to be rendered/compiled to an simple single htlm file with localstorage support with no login.

Everyone with access to the file can load the app.

The app will then have multiple screens and have use the following techstack.

## The TechStack

- Tailwind css
- React Single page

## Details

create a fitness app with sets, timers and video display preview from youtube, there is day/session, calendar tracking. Login screen is not necessary. Exercises displays as an accordion and only active exercise is active. Collapsed items are marked with a check if completed. There needs to be a nice way to mark as completed.

To design a comprehensive fitness app, we could include the following screens:
    Home Screen: Displays an overview of today's workout, upcoming sessions, and a quick access calendar.
    Exercise List Screen: Shows a detailed list of exercises for the selected day/session, with each exercise as an accordion item.
    Exercise Detail Screen: When an exercise is expanded, this screen displays the sets, timers, and an embedded YouTube video preview.
    Calendar Tracking Screen: A dedicated screen for users to view and manage their workout schedule and past sessions.

## Requiements

- App should not use hardcoded values, the csv provided will be stored as a json payload grouped by an UUID. And each routine id will hold a group of exercises
- Each excersise will be stored as unique with an uuid and will be associated to a routine by id only, being this the "database" of execerses (repository)
- The app will allow local storage by day, meaning the user will start a workout and the app will track time spend. The user can mark the routine as completed and that will be stored
- The app will keep track of sets per exercise the user has finished and will have timers to tack and control rest time and mark the set as complete
- When the app is reloaded it should recover the previous state from localstorage
- Use proper loading screens while the state loads

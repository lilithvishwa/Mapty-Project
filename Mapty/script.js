'use strict';

class Workout {
  date = new Date();
  id = (Date.now() + '').slice(-10);
  clicks = 0;

  constructor(coords, type, duration) {
    this.coords = coords;
    this.type = type;
    this.duration = duration;
    this._setDescription();
  }

  _setDescription() {
    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December',
    ];

    this.description = `${this.type[0].toUpperCase()}${this.type.slice(1)} on ${
      months[this.date.getMonth()]
    } ${this.date.getDate()}`;
  }

  click() {
    this.clicks++;
  }
}

class Running extends Workout {
  emoji = '🏃‍♂️';

  constructor(coords, distance, duration, cadence) {
    super(coords, 'running', duration);
    this.distance = distance;
    this.cadence = cadence;
    this.calcPace();
  }

  calcPace() {
    this.pace = this.duration / this.distance;
    return this.pace;
  }
}

class Cycling extends Workout {
  emoji = '🚴‍♀️';

  constructor(coords, distance, duration, elevationGain) {
    super(coords, 'cycling', duration);
    this.distance = distance;
    this.elevationGain = elevationGain;
    this.calcSpeed();
  }

  calcSpeed() {
    this.speed = this.distance / (this.duration / 60);
    return this.speed;
  }
}

class Yoga extends Workout {
  emoji = '🧘';

  constructor(coords, duration, sets) {
    super(coords, 'yoga', duration);
    this.sets = sets;
  }
}

class HomeWorkout extends Workout {
  emoji = '🏋️';

  constructor(coords, duration, sets) {
    super(coords, 'homeworkout', duration);
    this.sets = sets;
  }
}

class Swimming extends Workout {
  emoji = '🏊';

  constructor(coords, duration, laps) {
    super(coords, 'swimming', duration);
    this.laps = laps;
  }
}

// DOM Elements
const form = document.querySelector('.form');
const containerWorkouts = document.querySelector('.workouts');
const inputType = document.querySelector('.form__input--type');
const inputDistance = document.querySelector('.form__input--distance');
const inputDuration = document.querySelector('.form__input--duration');
const inputCadence = document.querySelector('.form__input--cadence');
const inputElevation = document.querySelector('.form__input--elevation');
const inputSets = document.querySelector('.form__input--sets');
const inputLaps = document.querySelector('.form__input--laps');

class App {
  #map;
  #mapZoomLevel = 13;
  #mapEvent;
  #workouts = [];

  constructor() {
    this._getPosition();
    this._getLocalStorage();

    form.addEventListener('submit', this._newWorkout.bind(this));
    inputType.addEventListener('change', this._toggleFields.bind(this));
    containerWorkouts.addEventListener('click', this._moveToPopup.bind(this));
  }

  _getPosition() {
    if (navigator.geolocation)
      navigator.geolocation.getCurrentPosition(
        this._loadMap.bind(this),
        function () {
          alert('Could not get your position');
        }
      );
  }

  _loadMap(position) {
    const { latitude, longitude } = position.coords;
    const coords = [latitude, longitude];

    this.#map = L.map('map').setView(coords, this.#mapZoomLevel);

    L.tileLayer('https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(this.#map);

    // Mark user location
    L.marker(coords)
      .addTo(this.#map)
      .bindPopup(
        L.popup({ autoClose: false, closeOnClick: false, className: 'user-location-popup' })
      )
      .setPopupContent('📍 You are here')
      .openPopup();

    this.#map.on('click', this._showForm.bind(this));

    this.#workouts.forEach(work => this._renderWorkoutMarker(work));
  }

  _showForm(mapE) {
    this.#mapEvent = mapE;
    form.classList.remove('hidden');
    inputDuration.focus();
  }

  _hideForm() {
    inputDistance.value = inputDuration.value = inputCadence.value =
      inputElevation.value = inputSets.value = inputLaps.value = '';
    form.classList.add('hidden');
  }

  _toggleFields() {
    const type = inputType.value;
    document.querySelector('.form__row--distance').style.display =
      type === 'running' || type === 'cycling' ? 'flex' : 'none';
    document.querySelector('.form__row--cadence').style.display =
      type === 'running' ? 'flex' : 'none';
    document.querySelector('.form__row--elevation').style.display =
      type === 'cycling' ? 'flex' : 'none';
    document.querySelector('.form__row--sets').style.display =
      type === 'yoga' || type === 'homeworkout' ? 'flex' : 'none';
    document.querySelector('.form__row--laps').style.display =
      type === 'swimming' ? 'flex' : 'none';
  }

  _newWorkout(e) {
    e.preventDefault();

    const type = inputType.value;
    const duration = +inputDuration.value;
    const { lat, lng } = this.#mapEvent.latlng;
    let workout;

    const valid = (...inputs) => inputs.every(i => Number.isFinite(i));
    const positive = (...inputs) => inputs.every(i => i > 0);

    if (type === 'running') {
      const distance = +inputDistance.value;
      const cadence = +inputCadence.value;
      if (!valid(distance, duration, cadence) || !positive(distance, duration, cadence))
        return alert('Enter positive numbers');
      workout = new Running([lat, lng], distance, duration, cadence);
    }

    if (type === 'cycling') {
      const distance = +inputDistance.value;
      const elevation = +inputElevation.value;
      if (!valid(distance, duration, elevation) || !positive(distance, duration))
        return alert('Enter valid numbers');
      workout = new Cycling([lat, lng], distance, duration, elevation);
    }

    if (type === 'yoga') {
      const sets = +inputSets.value;
      if (!valid(duration, sets) || !positive(duration, sets))
        return alert('Enter valid numbers');
      workout = new Yoga([lat, lng], duration, sets);
    }

    if (type === 'homeworkout') {
      const sets = +inputSets.value;
      if (!valid(duration, sets) || !positive(duration, sets))
        return alert('Enter valid numbers');
      workout = new HomeWorkout([lat, lng], duration, sets);
    }

    if (type === 'swimming') {
      const laps = +inputLaps.value;
      if (!valid(duration, laps) || !positive(duration, laps))
        return alert('Enter valid numbers');
      workout = new Swimming([lat, lng], duration, laps);
    }

    this.#workouts.push(workout);
    this._renderWorkoutMarker(workout);
    this._renderWorkout(workout);
    this._hideForm();
    this._setLocalStorage();
  }

  _renderWorkoutMarker(workout) {
    L.marker(workout.coords)
      .addTo(this.#map)
      .bindPopup(
        L.popup({ maxWidth: 250, minWidth: 100, autoClose: false, closeOnClick: false, className: `${workout.type}-popup` })
      )
      .setPopupContent(`${workout.emoji} ${workout.description}`)
      .openPopup();
  }

  _renderWorkout(workout) {
    let html = `
      <li class="workout workout--${workout.type}" data-id="${workout.id}">
        <h2 class="workout__title">${workout.description}</h2>
        <div class="workout__details">
          <span class="workout__icon">${workout.emoji}</span>
          <span class="workout__value">${workout.duration}</span>
          <span class="workout__unit">min</span>
        </div>`;

    if (workout.type === 'running')
      html += `
        <div class="workout__details">
          <span class="workout__icon">📏</span>
          <span class="workout__value">${workout.distance}</span>
          <span class="workout__unit">km</span>
        </div>
        <div class="workout__details">
          <span class="workout__icon">🦶</span>
          <span class="workout__value">${workout.cadence}</span>
          <span class="workout__unit">spm</span>
        </div>`;

    if (workout.type === 'cycling')
      html += `
        <div class="workout__details">
          <span class="workout__icon">📏</span>
          <span class="workout__value">${workout.distance}</span>
          <span class="workout__unit">km</span>
        </div>
        <div class="workout__details">
          <span class="workout__icon">⛰</span>
          <span class="workout__value">${workout.elevationGain}</span>
          <span class="workout__unit">m</span>
        </div>`;

    if (workout.type === 'yoga' || workout.type === 'homeworkout')
      html += `
        <div class="workout__details">
          <span class="workout__icon">🧮</span>
          <span class="workout__value">${workout.sets}</span>
          <span class="workout__unit">sets</span>
        </div>`;

    if (workout.type === 'swimming')
      html += `
        <div class="workout__details">
          <span class="workout__icon">🔁</span>
          <span class="workout__value">${workout.laps}</span>
          <span class="workout__unit">laps</span>
        </div>`;

    html += '</li>';
    form.insertAdjacentHTML('afterend', html);
  }

  _moveToPopup(e) {
    const workoutEl = e.target.closest('.workout');
    if (!workoutEl) return;
    const workout = this.#workouts.find(w => w.id === workoutEl.dataset.id);
    this.#map.setView(workout.coords, this.#mapZoomLevel, {
      animate: true,
      pan: { duration: 1 },
    });
  }

  _setLocalStorage() {
    localStorage.setItem('workouts', JSON.stringify(this.#workouts));
  }

  _getLocalStorage() {
    const data = JSON.parse(localStorage.getItem('workouts'));
    if (!data) return;
    this.#workouts = data;
    this.#workouts.forEach(w => this._renderWorkout(w));
  }

  reset() {
    localStorage.removeItem('workouts');
    location.reload();
  }
}

const app = new App();

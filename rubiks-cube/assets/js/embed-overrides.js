(function () {
  'use strict';

  function stopTween(tween) {
    if (tween && typeof tween.stop === 'function') tween.stop();
  }

  function installEmbedMode() {
    var game = window.game;
    if (!game || !game.cube || !game.transition || !game.controls || !game.world) {
      window.setTimeout(installEmbedMode, 16);
      return;
    }

    var transition = game.transition;
    var originalCube = transition.cube.bind(transition);
    var originalFloat = transition.float.bind(transition);
    var introPlayed = false;
    var introComplete = false;
    var floatStarted = false;
    var introDuration = 1800;

    function showCubeNow() {
      try {
        stopTween(transition.tweens && transition.tweens.cube);
        stopTween(transition.tweens && transition.tweens.float);
      } catch (error) {}

      game.cube.object.position.y = 0.2;
      game.cube.holder.position.set(0, 0, 0);
      game.cube.holder.rotation.set(0, 0, 0);
      game.cube.animator.position.set(0, 0, 0);
      game.cube.animator.rotation.set(0, 0, 0);
      game.controls.edges.position.y = game.cube.object.position.y;
      game.world.camera.zoom = 1.22;
      game.world.camera.updateProjectionMatrix();
      transition.activeTransitions = 0;
    }

    function prepareCubeIntro() {
      try {
        stopTween(transition.tweens && transition.tweens.cube);
      } catch (error) {}

      game.cube.object.position.y = 0.2;
      game.cube.holder.position.set(0, 0, 0);
      game.cube.holder.rotation.set(0, 0, 0);
      game.cube.animator.position.set(0, 4, 0);
      game.cube.animator.rotation.set(-Math.PI / 3, 0, 0);
      game.controls.edges.position.y = game.cube.object.position.y;
      game.world.camera.zoom = 1.22;
      game.world.camera.updateProjectionMatrix();
    }

    function playCubeIntro() {
      if (introPlayed) {
        if (!introComplete) return;
        showCubeNow();
        enablePlay();
        return;
      }

      introPlayed = true;
      prepareCubeIntro();
      game.controls.disable();

      if (!floatStarted) {
        floatStarted = true;
        originalFloat();
      }

      originalCube(true);
      window.setTimeout(function () {
        introComplete = true;
        enablePlay();
      }, introDuration);
    }

    function enablePlay() {
      game.state = 1;
      game.saved = true;
      game.newGame = false;
      game.controls.enable();
      if (game.dom && game.dom.game) {
        game.dom.game.style.pointerEvents = 'auto';
        game.dom.game.style.touchAction = 'none';
      }
    }

    transition.float = function () {
      if (floatStarted) return;
      floatStarted = true;
      originalFloat();
    };
    transition.cube = function (show) {
      if (show !== false) playCubeIntro();
      transition.activeTransitions = 0;
    };
    transition.title = function () {};
    transition.buttons = function () {};
    transition.timer = function () {};
    transition.complete = function () {};
    transition.elevate = function () {};
    transition.zoom = function () {};
    transition.stats = function () {};
    transition.preferences = function () {};
    transition.theming = function () {};

    game.game = function (show) {
      if (show !== false) {
        playCubeIntro();
      }
    };
    game.complete = function () {};
    game.stats = function () {};
    game.prefs = function () {};
    game.theme = function () {};
    game.controls.onSolved = function () {};
    game.controls.checkIsSolved = function () {};
    game.controls.playSequence = function (sequence, callback) {
      if (typeof callback === 'function') callback();
    };

    if (game.confetti) {
      game.confetti.start = function () {};
      game.confetti.stop = function () {};
      game.confetti.updateColors = function () {};
    }

    if (game.timer) {
      game.timer.start = function () {};
      game.timer.stop = function () {};
      game.timer.reset = function () {};
    }

    playCubeIntro();
  }

  installEmbedMode();
}());

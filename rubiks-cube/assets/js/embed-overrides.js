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

    function showCubeNow() {
      try {
        stopTween(transition.tweens && transition.tweens.cube);
        stopTween(transition.tweens && transition.tweens.float);
      } catch (error) {}

      game.cube.object.position.y = transition.data && typeof transition.data.cubeY === 'number'
        ? transition.data.cubeY
        : -0.2;
      game.cube.holder.position.set(0, 0, 0);
      game.cube.holder.rotation.set(0, 0, 0);
      game.cube.animator.position.set(0, 0, 0);
      game.cube.animator.rotation.set(0, 0, 0);
      game.controls.edges.position.y = game.cube.object.position.y;
      game.world.camera.zoom = transition.data && typeof transition.data.cameraZoom === 'number'
        ? transition.data.cameraZoom
        : 0.85;
      game.world.camera.updateProjectionMatrix();
      transition.activeTransitions = 0;
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

    transition.float = function () {};
    transition.cube = function (show) {
      if (show !== false) showCubeNow();
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
        showCubeNow();
        enablePlay();
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

    showCubeNow();
    enablePlay();
  }

  installEmbedMode();
}());
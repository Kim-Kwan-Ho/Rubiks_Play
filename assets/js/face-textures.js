( function() {
	'use strict';

	if ( typeof window === 'undefined' || ! window.THREE || ! window.game || ! window.game.cube ) return;

	var cube = window.game.cube;
	var proto = Object.getPrototypeOf( cube );

	if ( proto.__faceTexturesPatched ) {
		if ( cube.applyUserFaceTiles ) cube.applyUserFaceTiles();
		return;
	}

	proto.__faceTexturesPatched = true;
	proto.faceTiles = window.__CUBE_FACE_TILES__ || {};
	proto.faceNames = {
		F: 'front',
		B: 'back',
		R: 'right',
		L: 'left',
		U: 'up',
		D: 'down'
	};

	proto.ensureFaceTileState = function() {
		if ( ! this.faceTileTextures ) this.faceTileTextures = {};
		if ( ! this.facePlaneGeometry ) {
			var size = 1 / 3 * 1.005;
			this.facePlaneGeometry = new THREE.PlaneBufferGeometry( size, size );
		}
		if ( ! this.faceTextureLoader ) this.faceTextureLoader = new THREE.TextureLoader();
	};

	proto.decorateEdgesWithGrid = function() {
		if ( ! Array.isArray( this.pieces ) ) return;

		this.pieces.forEach( function( piece ) {
			var grid = {
				x: Math.round( piece.userData.start.position.x * 3 + 1 ),
				y: Math.round( piece.userData.start.position.y * 3 + 1 ),
				z: Math.round( piece.userData.start.position.z * 3 + 1 )
			};

			piece.children.forEach( function( child ) {
				if ( child.name && child.name.length === 1 ) child.userData.grid = grid;
			} );
		} );
	};

	proto.getFaceTile = function( faceName, gridPosition ) {
		var lastIndex = this.size - 1;
		var x = gridPosition.x;
		var y = gridPosition.y;
		var z = gridPosition.z;

		switch ( faceName ) {
			case 'F':
				return { col: x, row: y };
			case 'B':
				return { col: lastIndex - x, row: y };
			case 'R':
				return { col: lastIndex - z, row: y };
			case 'L':
				return { col: z, row: y };
			case 'U':
				return { col: x, row: lastIndex - z };
			case 'D':
				return { col: x, row: z };
			default:
				return { col: 0, row: 0 };
		}
	};

	proto.getTileUrl = function( faceName, gridPosition ) {
		if ( ! gridPosition ) return null;

		var tile = this.getFaceTile( faceName, gridPosition );
		var faceKey = this.faceNames[ faceName ];
		var faceTiles = this.faceTiles[ faceKey ];

		if ( ! faceTiles ) return null;

		return faceTiles[ String( tile.row ) ] && faceTiles[ String( tile.row ) ][ String( tile.col ) ]
			? faceTiles[ String( tile.row ) ][ String( tile.col ) ]
			: null;
	};

	proto.ensureImagePlaneGeometry = function( edge ) {
		this.ensureFaceTileState();

		if ( edge.userData.imagePlaneReady ) return;

		if ( edge.geometry ) edge.geometry.dispose();
		edge.geometry = this.facePlaneGeometry;
		if ( ! edge.userData.imagePlaneOffsetApplied ) {
			var offset = 0.003;
			if ( edge.name === 'L' ) edge.position.x -= offset;
			if ( edge.name === 'R' ) edge.position.x += offset;
			if ( edge.name === 'D' ) edge.position.y -= offset;
			if ( edge.name === 'U' ) edge.position.y += offset;
			if ( edge.name === 'B' ) edge.position.z -= offset;
			if ( edge.name === 'F' ) edge.position.z += offset;
			edge.userData.imagePlaneOffsetApplied = true;
		}
		edge.userData.imagePlaneReady = true;
	};

	proto.ensureImagePlaneMaterial = function( edge ) {
		if ( edge.material && edge.material.isMeshBasicMaterial ) return;

		if ( edge.material ) edge.material.dispose();
		edge.material = new THREE.MeshBasicMaterial( {
			color: 0xffffff,
			side: THREE.DoubleSide,
			polygonOffset: true,
			polygonOffsetFactor: -2,
			polygonOffsetUnits: -2,
			depthTest: true,
			depthWrite: false
		} );
	};

	proto.applyTileTextureToEdge = function( edge ) {
		var _this = this;
		this.ensureFaceTileState();
		this.ensureImagePlaneGeometry( edge );
		this.ensureImagePlaneMaterial( edge );

		var tileUrl = this.getTileUrl( edge.name, edge.userData.grid );
		if ( ! tileUrl ) {
			edge.material.map = null;
			edge.material.needsUpdate = true;
			return;
		}

		if ( this.faceTileTextures[ tileUrl ] ) {
			edge.material.map = this.faceTileTextures[ tileUrl ];
			edge.material.needsUpdate = true;
			return;
		}

		this.faceTextureLoader.load( tileUrl, function( texture ) {
			texture.wrapS = THREE.ClampToEdgeWrapping;
			texture.wrapT = THREE.ClampToEdgeWrapping;
			texture.minFilter = THREE.LinearFilter;
			texture.magFilter = THREE.LinearFilter;
			texture.generateMipmaps = false;
			_this.faceTileTextures[ tileUrl ] = texture;
			edge.material.map = texture;
			edge.material.needsUpdate = true;
		} );
	};

	proto.applyUserFaceTiles = function() {
		if ( ! Array.isArray( this.edges ) ) return;

		this.decorateEdgesWithGrid();

		this.edges.forEach( function( edge ) {
			this.applyTileTextureToEdge( edge );
		}, this );
	};

	var originalInit = proto.init;
	proto.init = function() {
		originalInit.call( this );
		this.ensureFaceTileState();
		this.applyUserFaceTiles();
	};

	proto.updateColors = function() {
		if ( typeof this.pieces !== 'object' && typeof this.edges !== 'object' ) return;

		this.pieces.forEach( function( piece ) {
			if ( piece.userData.cube.material && ! piece.userData.cube.material.isMeshBasicMaterial ) {
				piece.userData.cube.material.dispose();
				piece.userData.cube.material = new THREE.MeshBasicMaterial( { color: 0x111111 } );
			} else {
				piece.userData.cube.material.color.setHex( 0x111111 );
			}
		} );

		this.applyUserFaceTiles();
	};

	function disableSceneLighting() {
		if ( ! window.game || ! window.game.world || ! window.game.world.lights ) return;

		var lights = window.game.world.lights;
		if ( lights.ambient ) lights.ambient.intensity = 0;
		if ( lights.front ) lights.front.intensity = 0;
		if ( lights.back ) lights.back.intensity = 0;
	}

	function flattenControls() {
		if ( ! window.game || ! window.game.controls || ! window.game.controls.edges ) return;

		var edges = window.game.controls.edges;
		if ( edges.material && ! edges.material.isMeshBasicMaterial ) {
			edges.material.dispose();
			edges.material = new THREE.MeshBasicMaterial( {
				color: 0x000000,
				transparent: true,
				opacity: 0
			} );
		}
	}

	function createShadowTexture() {
		var canvas = document.createElement( 'canvas' );
		var context = canvas.getContext( '2d' );
		var gradient;

		canvas.width = 256;
		canvas.height = 256;

		gradient = context.createRadialGradient( 128, 128, 24, 128, 128, 128 );
		gradient.addColorStop( 0, 'rgba(0, 0, 0, 0.42)' );
		gradient.addColorStop( 0.55, 'rgba(0, 0, 0, 0.12)' );
		gradient.addColorStop( 1, 'rgba(0, 0, 0, 0)' );

		context.fillStyle = gradient;
		context.fillRect( 0, 0, 256, 256 );

		return new THREE.CanvasTexture( canvas );
	}

	function installCameraShadow() {
		var game = window.game;
		var world;
		var cubeObject;
		var texture;
		var shadowMaterial;
		var shadowMesh;
		var originalUpdate;

		if ( ! game || ! game.world || ! game.cube ) return;
		if ( game.world.userData && game.world.userData.cameraShadowInstalled ) return;

		world = game.world;
		cubeObject = game.cube.object;
		texture = createShadowTexture();

		texture.minFilter = THREE.LinearFilter;
		texture.magFilter = THREE.LinearFilter;
		texture.generateMipmaps = false;

		shadowMaterial = new THREE.MeshBasicMaterial( {
			map: texture,
			transparent: true,
			depthWrite: false,
			opacity: 0.75
		} );

		shadowMesh = new THREE.Mesh(
			new THREE.PlaneBufferGeometry( 1.9, 1.9 ),
			shadowMaterial
		);

		shadowMesh.renderOrder = -1;
		shadowMesh.frustumCulled = false;
		world.scene.add( shadowMesh );

		if ( ! world.userData ) world.userData = {};
		world.userData.cameraShadowInstalled = true;
		world.userData.cameraShadowMesh = shadowMesh;

		originalUpdate = world.update.bind( world );
		world.update = function() {
			var cubePosition = new THREE.Vector3();
			var cameraToCube = new THREE.Vector3();
			var cubeScale = game.cube.object.scale.x || 1;

			cubeObject.getWorldPosition( cubePosition );
			cameraToCube.copy( cubePosition ).sub( this.camera.position ).normalize();

			shadowMesh.position.copy( cubePosition ).addScaledVector( cameraToCube, 0.42 * cubeScale );
			shadowMesh.lookAt( this.camera.position );
			shadowMesh.scale.set( 1.25 * cubeScale, 1.25 * cubeScale, 1 );

			originalUpdate();
		};
	}

	cube.ensureFaceTileState();
	cube.applyUserFaceTiles();
	disableSceneLighting();
	flattenControls();
	installCameraShadow();

	if ( window.__CUBE_CONFIG__ && window.game && window.game.controls ) {
		if ( typeof window.__CUBE_CONFIG__.introFlipSpeed === 'number' ) {
			window.game.controls.introFlipSpeed = window.__CUBE_CONFIG__.introFlipSpeed;
		}
	}

	if ( window.game && window.game.confetti ) {
		window.game.confetti.start = function() {};
		window.game.confetti.stop = function() {};
		window.game.confetti.updateColors = function() {};
	}
} )();

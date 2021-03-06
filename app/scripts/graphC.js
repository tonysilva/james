'use strict';

app.controller('GraphCtrl', function ($scope, $firebaseArray) {

	var rgraph = {};
	$scope.load = true;

	$scope.begin = function () {
		window.location.reload();
	}

	$scope.startExtraction = function () {
		$scope.load = false;
		document.getElementById('infovis').innerHTML = "";
		try{
			if (($scope.jsonReference && $scope.firebaseReference) || (!$scope.jsonReference && !$scope.firebaseReference)) {
				Materialize.toast('To proceed fill only one of the fields', 6000);
				$scope.load = true;
			} else if ($scope.jsonReference) {
				var nodesjson = JSON.parse($scope.jsonReference);
				if (nodesjson) {
					var father = {
						'id': 'root',
						'name': 'ROOT',
						'data': nodesjson,
						'children':[]
					};
					recursive(nodesjson, father);
					buildGraph(father);
					$scope.load = true;
					$scope.nextNode(father.data);
				} 
			} else {
				var nodesfire = $firebaseArray(new Firebase($scope.firebaseReference));
				nodesfire.$loaded().then(function(nodeRef) {
					if (nodeRef) {
						var father = {
							'id': 'root',
							'name': 'ROOT',
							'data': {'ROOT':nodeRef},
							'children':[]
						};
						recursive(nodeRef, father);
						//init build of the graph
						buildGraph(father);
						$scope.load = true;
						$scope.nextNode(father.data);
						//console.log(JSON.stringify(father, null, 4));
					}
				});
			}
		} catch (e) {
			Materialize.toast(e, 6000);
			$scope.load = true;
		}
	};

	function recursive(root, father) {
		var countItem = 0;
		angular.forEach(root, function(value, id) {
			if (typeof value === 'object' && typeof value !== undefined && !String(id).startsWith('$')) {
				countItem = countItem + 1;
				//var name = String(id).startsWith('-') || (typeof id === 'number') ? countItem : id;
				var name = id;
				var nodeId = randomString(6);
				value.nodeId = nodeId;
				var children = {
					'id': nodeId,
					'name': name,
					'data': value,
					'children':[]
				};
				father.children.push(children);
				recursive(value, children);
			}
		});
	}

	function randomString(length) {
		return Math.round((Math.pow(36, length + 1) - Math.random() * Math.pow(36, length))).toString(36).slice(1);
	}

	function buildGraph(json) {
		var labelType, useGradients, nativeTextSupport, animate;

		(function() {
		  var ua = navigator.userAgent,
		      iStuff = ua.match(/iPhone/i) || ua.match(/iPad/i),
		      typeOfCanvas = typeof HTMLCanvasElement,
		      nativeCanvasSupport = (typeOfCanvas == 'object' || typeOfCanvas == 'function'),
		      textSupport = nativeCanvasSupport 
		        && (typeof document.createElement('canvas').getContext('2d').fillText == 'function');
		  labelType = (!nativeCanvasSupport || (textSupport && !iStuff))? 'Native' : 'HTML';
		  nativeTextSupport = labelType == 'Native';
		  useGradients = nativeCanvasSupport;
		  animate = !(iStuff || !nativeCanvasSupport);
		})();

	    //init rgraph
	    rgraph = new $jit.RGraph({
	        'injectInto': 'infovis',
	        //Optional: create a background canvas and plot concentric circles in it.
	        'background': {
	          CanvasStyles: {
	            strokeStyle: '#555'
	          }
	        },
	        Node: {
	            //set the RGraph rendering function as node type
	            //'type': 'piechart'
	            dim: 20,
	            color: "#772277"
	        },
	        Edge: {
	            color: '#772277'
	        },
	        levelDistance: 100,
	        //Duration
	        duration: 1000,
	        //Add styles to node labels on label creation
	        onCreateLabel: function(domElement, node){
	            domElement.innerHTML = node.name;
	            var style = domElement.style;
	            style.fontSize = "0.8em";
	            style.color = "#fff";
	            style.cursor = "pointer";
	            domElement.onclick = function() {
					angular.forEach(node.data, function(value, id) {
						if (typeof value === 'object' && typeof value !== undefined && !String(id).startsWith('$')) {
							node.data[id].object = 'object';
						}
					});
					$scope.nodeCentral = node.data;
					$scope.$apply();
					rgraph.onClick(node.id, {
	                	hideLabels: false
	              	});
	            };
	        },
	        
	        onPlaceLabel: function(domElement, node){
	            var style = domElement.style;
	            var left = parseInt(style.left);
	            var w = domElement.offsetWidth;
	            style.left = (left - w / 2) + 'px';
	            style.display = '';
	        }
	    });
	    //end
	    rgraph.loadJSON(json);
	    rgraph.refresh();
	}

	$scope.nextNode = function (node) {
		angular.forEach(node, function(value, id) {
			if (typeof value === 'object' && typeof value !== undefined && !String(id).startsWith('$')) {
				node[id].object = 'object';
			}
		});
		delete node.object;
		$scope.nodeCentral = node;
		if (node.nodeId) {
			rgraph.onClick(node.nodeId, {
	        	hideLabels: false
	      	});
		}
	};

});
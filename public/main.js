angular.module('vote', ['ngResource']);
angular.module('vote').controller('VoteCtrl', function($scope){

	var sock = new SockJS('http://troller.hp.af.cm/echo');
	sock.onopen = function() {
	   console.log('open');
	   $scope.disconnected = false;
	   $scope.$apply();
	};
	sock.onmessage = function(e) {
		switch(JSON.parse(e.data).type) {
			case "vote_sent" :
				$scope.message = "Troll accepted!!! Please wait to troll again.";
				break;
			case "vote_timeout_over":
				$scope.message = "You may troll again.";
				break;
			case "vote_limit_reached":
				$scope.message = "Please Wait To Troll Again."
				break;
			case 'voting_not_enabled':
				$scope.message = "Trolling isn't turned on. Wait a few second and try again."
				break;
			default :
				console.log('unknown message', e);
				break;
		}
		$scope.$apply();
	};
	sock.onclose = function() {
	   console.log('close');
	   $scope.disconnected = true;
	   $scope.$apply();
	};

	$scope.disconnected = true;
	$scope.message = "Go ahead and troll by clicking a button.";

	$scope.submit = function(word){
		sock.send(JSON.stringify({
			type: 'vote',
			data : { word : word }	
		}));
	};

});

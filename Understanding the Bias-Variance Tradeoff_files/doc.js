Math.seedrandom(2);

var width = 600,
	height = 400;
var padding = 40;

var vertices;

var chart_rawdata = d3.select("#chart_rawdata_knn").append("svg").attr("width", width).attr("height", height).attr("class", "RdBu");

var chart_knn1 = d3.select("#chart_knn1").append("svg").attr("width", width).attr("height", height).attr("class", "RdBu");


var chart_predict_knn = d3.select("#chart_predict_knn").append("svg").attr("width", width).attr("height", height).attr("class", "RdBu");

var chart_region_knn = d3.select("#chart_region_knn").append("svg").attr("width", width).attr("height", height).attr("class", "RdBu");

var test_data = d3.range(80).map(function() {
	var x = Math.random() * (width - padding) + padding / 2;
	var y = Math.random() * (height - padding) + padding / 2;
	return [x, y, 0];
});


var region_data = [];
var region_width = 12;
region_data = makeHexGrid(width, height, region_width);
for (var i = 0; i < region_data.length; i++) {
	region_data[i].v = 0
}


var initData = false;
generateTraining();

function generateTraining() {
	vertices = d3.range(200).map(function(d) {
		var x = Math.random() * (width - padding) + padding / 2;
		var y = Math.random() * (height - padding) + padding / 2;
		return [x, y, genData(x, y)];
	});
	if (!initData) {
		chart_knn1.selectAll("path").data(d3.geom.voronoi(vertices)).enter().append("path");

		[chart_knn1, chart_rawdata].forEach(function(x) {
			x.selectAll("circle").data(vertices).enter().append("circle");
		});
		
		/*chart_rawdata.selectAll("text")
		.data([[width/2,height-20,"Wealth ",0]]).enter()
		.append("text")
		.attr("transform", function(d){return "translate(" + 
    d.slice(0,2)+ ")";})
	.text(function(d){return d[2];})
	.style("background-color","white");*/
	}

	chart_knn1.selectAll("path").data(d3.geom.voronoi(vertices)).transition().attr("class", function(d, i) {
		return "q" + (vertices[i][2] == 1 ? "3" : "5") + "-9";
	}).attr("d", function(d) {
		return "M" + d.join("L") + "Z";
	});

	[chart_knn1, chart_rawdata].forEach(function(x) {
		x.selectAll("circle").data(vertices).transition().attr("transform", function(d) {
			return "translate(" + d.slice(0, 2) + ")";
		}).attr("class", function(d, i) {
			return "q" + (vertices[i][2] == 1 ? "0" : "8") + "-9";
		}).attr("r", 5);
	});

	chart_predict_knn.selectAll(".hulls").data(d3.geom.voronoi(vertices)).attr("class", function(d, i) {
		return "hulls " + "q" + (vertices[i][2] == 1 ? "3" : "5") + "-9";
	}).attr("d", function(d) {
		return "M" + d.join("L") + "Z";
	});

	knnUpdatePredictions($('#knnSlider').val());


	initData = true;
}





function genData(x, y) {
	if (Math.random() > .7) {
		return Math.round(Math.random());
	}
	return bndry(x, y);
}

function bndry(x, y) {
	var nx = x / width * 10 + 1.5;
	var ny = (height - y) / height * 10;

	if (ny < 1.1 * nx - 0.1 * Math.pow(nx, 2) + 2 * Math.sin(nx) + 3) {
		return 0;
	} else {
		return 1;
	}
}

function knnPredict(data, loc, k) {
	var nn = getKnn(data, loc, k);
	var sum = 0;
	for (var i = 0; i < k; i++) {
		sum = sum + data[nn[i]][2];
	}
	return sum / k;
}

function getKnn(data, loc, k) {
	var dists = [];
	for (var i = 0; i < data.length; i++) {
		dists.push([i, dist(data[i], loc)]);
	}
	dists.sort(function(a, b) {
		return a[1] - b[1];
	});
	var res = [];
	for (var i = 0; i < k; i++) {
		res.push(dists[i][0]);
	}
	return res;
}

function dist(x, y) {
	return Math.pow(x[0] - y[0], 2) + Math.pow(x[1] - y[1], 2);
}


var knnPredictInit = false;

function knnUpdatePredictions(k) {
	if (!knnPredictInit) {
		chart_predict_knn.selectAll(".hulls").data(d3.geom.voronoi(vertices)).enter().append("path").attr("class", function(d, i) {
			return "hulls " + "q" + (vertices[i][2] == 1 ? "3" : "5") + "-9";
		}).attr("d", function(d) {
			return "M" + d.join("L") + "Z";
		}).attr("opacity", .12);

		chart_predict_knn.selectAll("circle").data(test_data).enter().append("circle").attr("transform", function(d) {
			return "translate(" + d.slice(0, 2) + ")";
		});

		var hexLine = d3.svg.line().x(function(d) {
			return d.x;
		}).y(function(d) {
			return d.y;
		}).interpolate("linear");


/*chart_region_knn.selectAll("rect").data(region_data).enter().append("rect").attr("transform", function(d) {
			return "translate(" + d.slice(0, 2) + ")";
		}).attr("width", region_width).attr("height", region_width);*/

		chart_region_knn.selectAll(".hex").data(region_data.map(function(x) {
			return x.hex;
		})).enter().append("path").attr("d", hexLine).attr("class", "hex");

		var boundaryLine = d3.svg.line().x(function(d) {
			return d.x;
		}).y(function(d) {
			return d.y;
		}).interpolate("basis");

		chart_region_knn.selectAll(".boundary").data([genBoundary()]).enter().append("path").attr("d", boundaryLine).attr("class", "boundary");
		knnPredictInit = true;
	}

	for (var i = 0; i < test_data.length; i++) {
		test_data[i][2] = knnPredict(vertices, test_data[i].slice(0, 2), k)
	}
	for (var i = 0; i < region_data.length; i++) {
		region_data[i].v = knnPredict(vertices, [region_data[i].x, region_data[i].y], k)
	}
	chart_predict_knn.selectAll(".hulls").transition().attr("opacity", .12);

	chart_predict_knn.selectAll("circle").data(test_data).attr("class", function(d, i) {
		return "q" + (8 - Math.round(test_data[i][2] * 8)) + "-9";
	}).attr("r", 7).on("mouseover", function() {
		var loc = d3.select(this).data()[0].slice(0, 2);
		var nn = getKnn(vertices, loc, k);

		chart_predict_knn.selectAll(".hulls").attr("opacity", function(d, i) {
			if (nn.indexOf(i) > -1) {
				return 1;
			} else {
				return .12;
			}
		});
	}).on("mouseout", function() {
		chart_predict_knn.selectAll(".hulls").attr("opacity", .12);
	});;

	chart_region_knn.selectAll(".hex").data(region_data).attr("class", function(d, i) {
		return "hex q" + (8 - Math.round(region_data[i].v * 8)) + "-9";
	});


}

function makeHexGrid(width, height, radius) {
	var items = [];
	var ca = Math.cos(Math.PI * 2 * 1 / 6) * radius;
	var sa = Math.sin(Math.PI * 2 * 1 / 6) * radius;
	var h = ca * 2 * radius;
	var w = (radius * 2 + h) / 2;
	var flip = false;
	for (var x = 0; x < width + radius; x = x + radius + ca) {
		for (var y = (flip ? 0 : sa); y < height + radius; y += sa * 2) {
			items.push({
				x: x,
				y: y,
				hex: makeHex([x, y], radius)
			})
		}
		flip = !flip;
	}
	return items;
}

function makeHex(center, radius) {
	var points = [];
	for (var i = 0; i < 7; i++) {
		points.push({
			x: Math.cos(2 * Math.PI * i / 6) * radius + center[0],
			y: Math.sin(2 * Math.PI * i / 6) * radius + center[1]
		});
	}
	return points;
}

function genBoundary() {
	var step = 1;
	var data = [];
	for (var x = 1.5; x <= 11.5; x += step) {
		data.push({
			x: (x - 1.5) / 10 * width,
			y: height - (1.1 * x - 0.1 * Math.pow(x, 2) + 2 * Math.sin(x) + 3) / 10 * height
		})
	}
	return data;
}

function drawScatter(id, biasLevel, varLevel) {

	var w = 200;




	var svg = d3.select(id).append("svg").attr("width", w).attr("height", w).style("border", "none");
	var circles = [w / 2.2, w / 3.2, w / 5.5, w / 15];
	svg.selectAll(".ring").data(circles).enter().append("circle").attr("class", "ring").attr("cx", w / 2).attr("cy", w / 2).attr("r", function(d) {
		return d;
	}).style("fill", function(d, i) {
		return i == 3 ? "#C12F3E" : (i == 1 ? "#76B3D8" : "white");
	});

	var biasAngle = Math.random() * Math.PI * 2;
	var biasDist = w / 2 * biasLevel;

	var n = 25;
	var locs = [];
	for (var i = 0; i < n; i++) {
		var varAngle = Math.random() * Math.PI * 2;
		var varDist = w / 2 * varLevel * Math.random();
		locs.push([Math.cos(biasAngle) * biasDist + Math.cos(varAngle) * varDist + w / 2, Math.sin(biasAngle) * biasDist + Math.sin(varAngle) * varDist + w / 2]);
	}

	svg.selectAll(".arrow").data(locs).enter().append("circle").attr("class", "arrow").attr("cx", function(d) {
		return d[0];
	}).attr("cy", function(d) {
		return d[1];
	}).attr("r", 2.5);

}

Math.seedrandom(3);
drawScatter("#bullsEyeHBLV", .5, .12);
drawScatter("#bullsEyeLBLV", .05, .12);
drawScatter("#bullsEyeHBHV", .7, .5);
drawScatter("#bullsEyeLBHV", .05, .5);

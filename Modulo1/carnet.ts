$.urlParam = function(name:string){
  var url = window.location.href;
  var results:any = url.split("/");

  return results[name];
}

var imagenCarnet:any = null

$(".formValidateAgregarUsuario").validate({
  rules: {
    nombre: {
      required: true,
      minlength: 2
    },
    apellido: {
      required: true,
      minlength: 2
    },
    dni: {
      required: true,
      minlength: 5
    },
    tipo:"required",
    sexo:"required",
    fNacimiento:"required",
  },
  messages: {
    nombre: "Especifica un nombre",
    apellido: "Especifica un apellido",
    dni: "Especifica un dni",
    tipo: "Especifica un privilegio",
    sexo: "Especifica un sexo",
    fNacimiento: "Especifica una fecha de nacimiento"
  },
  errorElement : 'div',
  errorPlacement: function(error:Error, element) {
    var placement = $(element).data('error');
    if (placement) {
      $(placement).append(error)
    } else {
      error.insertAfter(element);
    }
  },
  submitHandler: function(form) {
    var data = new FormData(form); 
    data.append('imagen', imagenCarnet)
    data.append('cobro', 0)
    //var data = $(form).serialize();
    //data = data + '&cobro=0';
    $.ajax({
      url: 'usuarios',
      type: "post",
      dataType: 'html',
      data: data,
      cache: false,
      contentType: false,
      processData: false
    }).done(function(result){
      var mensaje = RecibirMensaje(result);
      Materialize.toast('<span>'+mensaje[1]+'</span>', 2000);
    }).fail(function( jqXHR, textStatus, errorThrown ) {
      alert( "Request failed: " + textStatus + errorThrown + jqXHR );
	console.log(jqXHR)
    })
    .always(function() {
      alert( "complete" );
    });
   
    /*$.post('usuarios', data,  function(result){
      var mensaje = RecibirMensaje(result);
      Materialize.toast('<span>'+mensaje[1]+'</span>', 2000);
    });*/
  }
});

$( document ).ready(function() {
  $('#tabla-usuarios').DataTable( {
    "language": {
      /*"lengthMenu": "Display _MENU_ records per page",*/
      "zeroRecords": "No se encontro nada",
      "info": "Pagina _PAGE_ de _PAGES_",
      "infoEmpty": "No hay datos",
      "infoFiltered": "(Filtrado _MAX_ del total)",
      "search": "Buscador",
      "paginate": {
        "first":      "Primero",
        "last":       "Ultimo",
        "next":       "Sig.",
        "previous":   "Prev."
      },
      "lengthMenu":     "_MENU_"
    }
  } );
});

function EliminarUsuario(id){
  swal({   title: "Estas seguro que quieres eliminar?",
  text: "No podras volver atras!",
  type: "warning",
  showCancelButton: true,
  confirmButtonColor: "#DD6B55",
  confirmButtonText: "Si",
  cancelButtonText: "No",
  closeOnConfirm: false,
  closeOnCancel: false },
  function(isConfirm){
    if (isConfirm) {
      $.post('usuarios', {funcion: 'eliminar', dato: id}, function(result) {
        var mensaje = RecibirMensaje(result);
        swal({ title: "Eliminado!",
        text: mensaje[1],
        type: mensaje[0]},
        function(isConfirm){
          if (isConfirm) {
            location.reload();
          }
        });
      });
    } else {
      swal("Cancelado", "Se mantienen los datos", "error");
    }
  });
}


var app = angular.module('App', ['ui.materialize', 'uiCropper', 'webcam']);

app.controller('CarnetController', ['$scope', '$http', '$filter', function ($scope, $http, $filter) {

  $scope.ConsultaSocio = "ConsultaSocioPorUid";  
  $scope.myImage= null;

  $scope.GetData = function() {

    $http({
      url: "socios",
      method: "POST",
      headers: {'Content-Type': 'application/x-www-form-urlencoded'},
      data: $.param({funcion: $scope.ConsultaSocio, dato: $.urlParam(6)})
    }).success(function(data, status, headers, config) {

      $scope.ConsultaSocioNombre = data.socio.nombre;
      $scope.ConsultaSocioApellido = data.socio.apellido;
      $scope.ConsultaSocioActivo = data.socio.activo;
      $scope.ConsultaSocioSid = data.socio.sid;
      $scope.ConsultaSocioDni = data.socio.dni;
      $scope.ConsultaSocioImagen = data.socio.imagen;

      if ($scope.ConsultaSocioImagen) {
        $scope.myImage = 'https://clubangloviejo.ddns.net/gestion/styles/images/socios/' + $scope.ConsultaSocioImagen
      }

      $scope.generarCarnet($scope.myImage)

    }).error(function(data, status, headers, config) {
      $scope.status = status;
	    console.error(data);
    });

  }

  $scope.GetData();

  var _video = null,
        patData = null;

    $scope.patOpts = {x: 0, y: 0, w: 25, h: 25};

    // Setup a channel to receive a video property
    // with a reference to the video element
    // See the HTML binding in main.html
    $scope.channel = {};

    $scope.webcamError = false;
    $scope.onError = function (err) {
        $scope.$apply(
            function() {
                $scope.webcamError = err;
            }
        );
    };

    $scope.onSuccess = function () {
        // The video element contains the captured camera data
        _video = $scope.channel.video;
        $scope.$apply(function() {
            $scope.patOpts.w = _video.width;
            $scope.patOpts.h = _video.height;
            //$scope.showDemos = true;
        });
    };

    $scope.onStream = function (stream) {
        // You could do something manually with the stream.
    };

	$scope.makeSnapshot = function() {
        if (_video) {
            var patCanvas = document.querySelector('#snapshot');
            if (!patCanvas) return;

            patCanvas.width = _video.width;
            patCanvas.height = _video.height;
            var ctxPat = patCanvas.getContext('2d');

            var idata = getVideoData($scope.patOpts.x, $scope.patOpts.y, $scope.patOpts.w, $scope.patOpts.h);
            ctxPat.putImageData(idata, 0, 0);

            sendSnapshotToServer(patCanvas.toDataURL());

            patData = idata;
        }
    };
    
    /**
     * Redirect the browser to the URL given.
     * Used to download the image by passing a dataURL string
     */
    $scope.downloadSnapshot = function downloadSnapshot(dataURL) {
        window.location.href = dataURL;
    };
    
    var getVideoData = function getVideoData(x, y, w, h) {
        var hiddenCanvas = document.createElement('canvas');
        hiddenCanvas.width = _video.width;
        hiddenCanvas.height = _video.height;
        var ctx = hiddenCanvas.getContext('2d');
        ctx.drawImage(_video, 0, 0, _video.width, _video.height);
        return ctx.getImageData(x, y, w, h);
    };

    /**
     * This function could be used to send the image data
     * to a backend server that expects base64 encoded images.
     *
     * In this example, we simply store it in the scope for display.
     */
    var sendSnapshotToServer = function sendSnapshotToServer(imgBase64) {
        $scope.snapshotData = imgBase64;
    };

  $scope.myCroppedImage='';
  var handleFileSelect=function(evt) {
    var file=evt.currentTarget.files[0];    
    imagenCarnet = evt.currentTarget.files[0]
    var reader = new FileReader();
    reader.onload = function (evt) {
      $scope.$apply(function($scope){
        $scope.myImage=evt.target.result;        
        $scope.generarCarnet($scope.myImage)
      });
    };
    reader.readAsDataURL(file);
  };
  angular.element(document.querySelector('#fileInput')).on('change',handleFileSelect);

  $scope.carnet = document.getElementById('carnet-canvas'),
  $scope.ccarnet = $scope.carnet.getContext('2d');

  $scope.generarCarnet = function (socioImg) {
    base_image = new Image();
    base_image.src = 'https://clubangloviejo.ddns.net/gestion/styles/images/anglo_carnet.png';
    $scope.ccarnet.clearRect(0, 0, $scope.carnet.width, $scope.carnet.height)
    base_image.onload = function(){
      $scope.ccarnet.drawImage(base_image, 0, 0, $scope.carnet.width, $scope.carnet.height);

      var qr = new QRCode(0, 0, 'NUMBER');
      if ($scope.ConsultaSocioDni) {
        qr.addData($scope.ConsultaSocioDni);
        qr.make();
        var modules = qr.getModuleCount();
        var size = 114;
        var tile = size / modules;
        for (var row = 0; row < modules; row++) {
          for (var col = 0; col < modules; col++) {
            var w = (Math.ceil((col + 1) * tile) - Math.floor(col * tile)),
                h = (Math.ceil((row + 1) * tile) - Math.floor(row * tile));
                $scope.ccarnet.fillStyle = qr.isDark(row, col) ? '#000' : '#fff';
                $scope.ccarnet.fillRect(16 + Math.round(col * tile), 140 + Math.round(row * tile), w, h);
          }
        }
        $scope.ccarnet.font = "16px Trebuchet MS";
        $scope.ccarnet.fillStyle = "grey";
        $scope.ccarnet.fillText('Socio Nº:', 150, 160);       
        $scope.ccarnet.font = "20px Trebuchet MS";
        $scope.ccarnet.fillStyle = "black";
        $scope.ccarnet.fillText($scope.ConsultaSocioSid, 220, 160);      
        $scope.ccarnet.font = "18px Trebuchet MS";
        $scope.ccarnet.fillText($scope.ConsultaSocioApellido + ' ' + $scope.ConsultaSocioNombre, 150, 190);
        $scope.ccarnet.font = "16px Trebuchet MS";
        $scope.ccarnet.fillStyle = "grey";
        $scope.ccarnet.fillText('DNI:', 150, 220);   
        $scope.ccarnet.font = "20px Trebuchet MS";
        $scope.ccarnet.fillStyle = "black";
        $scope.ccarnet.fillText($scope.ConsultaSocioDni, 150, 250);       
      }
      
    }
    socio_image = new Image();
    socio_image.src = socioImg;
    socio_image.onload = function(){
      $scope.ccarnet.drawImage(socio_image, 14, 11, 114, 114);
    }

  }

  $scope.$watch('myCroppedImage', function(newValue, oldValue) {
    $scope.generarCarnet(newValue)
  });

  $scope.imprimirCarnet = function () {
    var imgData = $scope.carnet.toDataURL("image/jpeg", 1.0);
    var pdf = new jsPDF('l', 'mm', [85, 54]);

    pdf.addImage(imgData, 'JPEG', 0, 0, 85, 54);
    pdf.save("carnet " + $scope.ConsultaSocioApellido + ' ' + $scope.ConsultaSocioNombre + ' ' + $scope.ConsultaSocioDni + ".pdf");
  }

}]);

// todaylist.js의 getTodayList() function호출
// 이거 main으로 옮기는게 좋을듯 
//getTodayList();

///////////////////// modal event area ////////////////////
var startdate, starttime, title, content, gender, alarmBell, jsonData, alarmObj, sourceObj, introObj, endingObj;
var audioObjects;

// dto 요소들을 현재 설정되어 있는 값으로 설정해주는 함수(startdate,starttime제외)
// 
function setAllElements($targetForm) {
    title = $targetForm.find(".title").val();
    content = $targetForm.find(".content").val();
    gender = $targetForm.find(".voiceGender option:selected").val();
    alarmBell = $targetForm.find(".alarmBell option:selected").val();
    setAudioElements();
}

function setAudioElements() {
    alarmObj = $("#hiddenAlarm" + alarmBell)[0];
    sourceObj = $("#sourcePlayer")[0];
    introObj = $("#introPlayer")[0];
    endingObj = $("#endingPlayer")[0];
    audioObjects = [alarmObj, introObj, sourceObj, endingObj];
}

// 화면내의 dto요소들 전체 초기화(reset) - 조회(수정)화면 & 등록화면 
// 코드수정할것
// 초기화되어야하는 모든 요소를 파악하고 하나씩 고치자. 
function removeAllElements() {
    var inputElements = ["title", "content",
        "intro", "ending", "ymdSet", "timeSet",
        "RUDoriginalIntro", "RUDoriginalEnding","RUDoriginalPath"];

    // inputElements 초기화 
    for (let i = 0; i < inputElements.length; i++) {
        var $targetClass = $("." + inputElements[i]);
        $targetClass.each(function () {
            $(this).val("");
        })
    }

    for (let i = 0; i < 2; i++) {
        $(".voiceGender")[i].value = $(".voiceGender")[i][0].value;
        $(".alarmBell")[i].value = $(".alarmBell")[i][0].value;
        $(".RUDfileName")[i].value = "등록된 파일이 없습니다.";
        $($(".fakeBtnForAdditional")[i]).css('display', 'none');
    }

    for (let i = 0; i < 4; i++) {
        $(".uploadCancelBtn")[i].innerHTML = "";
    }

    $("#sourcePlayer").attr('src', "");
    $("#introPlayer").attr('src', "");
    $("#endingPlayer").attr('src', "");
}

// ===============================================================================
// 띄어쓰기 교정  ==>  API이상함. 다른걸로 수정하던지 없애던지 할 것 
// rud적용 완료.
$(".spaceChecker").on("click", function (e) {
    e.preventDefault();
    var key = "3439797815659168424";
    var $contentArea = $(this).parent().parent().parent().find('.content')
    var sentence = $contentArea.val();
    var jsonData = {
        key: key,
    };
    $.getJSON("http://api.adams.ai/datamixiApi/autospacing?sentence=" + sentence, jsonData, function (data) {
        var resultText = data.return_object.answer;
        $contentArea.val(resultText);
    })
})
// ===============================================================================

// 긴급공지 체크 이벤트 - 비활성화시켜야할 요소들 disabled
// register only 수정 필요 없음. 
$(".urgentCheck").change(function (e) {
    var isChecked = $(".urgentCheck").is(":checked");
    $("#ymdSet, #timeSet").prop("disabled", isChecked);
    $("#repeat").prop("disabled", isChecked);
    if (isChecked) {
        $("#ymdSet, #timeSet").css("background-color", "lightgray")
        $("#repeatView").css("background-color", "lightgray");
    } else {
        $("#ymdSet, #timeSet").css("background-color", "")
        $("#repeatView").css("background-color", "");

    }

});
// ===============================================================================

// 등록버튼클릭시 인트로와/엔딩오디오가 업로드 되어있는지 확인 및 controller로 데이터날린 후 저장하고
// uuid를 포함한 파일명을 return하는 함수
// just function 수정 필요 없음. 
function checkadditionalAudioExist(object) {
    var formData = new FormData();
    var wholeFileName = "";
    formData.append("additionalAudio", object[0]);
    $.ajax({
        url: 'http://localhost:8080/rbcboard/registerFiles',
        processData: false,
        contentType: false,
        async: false,
        data: formData,
        type: 'POST',
        dataType: 'json',
        success: function (result) {
            wholeFileName = result[0].substring(result[0].lastIndexOf("*") + 1, result[0].length);
        }
    });
    return wholeFileName;
} // end of checkadditionalAudioExist function

// ===============================================================================

// 파일 유효성 검사 function (파일크기, 파일형식)
// just function 수정 필요 없음. 
// 파일명에 특문(특히 *, /, -) 걸러주기! 
function validateFile(fileName, fileSize) {
    var regex = new RegExp("(.*?)\.(wav|mp3|wma|aac|flac|mmf)$");
    var maxSize = 10485760;
    if (fileSize > maxSize) {
        alert("업로드 가능한 파일 크기를 초과했습니다.")
        return false;
    };
    if (!regex.test(fileName)) {
        alert("해당 형식의 파일은 업로드 할 수 없습니다.")
        return false;
    };
    return true;
}

// ===============================================================================

// 오디오객체배열을 파라미터로 받아 재생시켜주는 function
// 동작은하나 코드 수정이 시급해보임
function playAllAudios(audios, isUrgent) {
    for (let j = audios.length - 1; j > 0; j--) {
        // 이거 나중에 수정해주자 : 페이지경로로되어있는 이유는 초기화해주어서 그런듯 
        if (audios[j].src.startsWith("http://localhost:8080/bcboard/todayList")) {
            audios.splice(j, 1);
        } else {
            audios[j].load();
        }
    }
    audios[0].play();
    for (let i = 0; i < audios.length - 1; i++) {
        audios[i].addEventListener("ended", function () {
            audios[i + 1].play();
            if (i == audios.length - 2 && isUrgent == 1) {
                // 긴급공지인 경우라면 끝나고 location.reload 
                audios[i + 1].addEventListener("ended", function () {
                    this.removeEventListener("ended", arguments.callee);
                    location.reload();
                })
            }
            this.removeEventListener("ended", arguments.callee);
        });

    }
}

// ===============================================================================

// 파일 업로드되면 취소하는 버튼 만드는 function
// rud적용 완료.
function makeCancelBtn($targetAdditionalAudio) {
    var $cancelBtnArea = $targetAdditionalAudio.parent().parent().find('.uploadCancelBtn');
    $cancelBtnArea[0].innerHTML = "<i class='material-icons cancelBtn'>cancel</i>";
}

// ===============================================================================

// 파일업로드 취소 버튼 event (업로드된 파일reset)
// rud적용 완료.
$(".uploadCancelBtn").on("click", function () {
    var $targetTr = $(this).parent();
    var $targetFileArea = $targetTr.children().find($("input[type='file']"));
    // player필드까지 지워줘야함. 
    $targetFileArea.val("");
    this.innerHTML = "";
    // 수정의 경우라면, fileName필드까지 지워줘야함  
    // target = intro or ending 
    var target = $targetFileArea.attr('name');
    if (target.startsWith('RUD')) {
        target = target.substring(3, target.length);
    }
    $("#" + target + "Player").attr('src', '');

    if ($targetTr.find(".RUDfileName").length > 0) {
        $targetTr.find(".RUDfileName").val("등록된 파일이 없습니다");
    }
});

// ===============================================================================

// 파일 업로드 감지(업로드~미리듣기 전까지의 과정)
// rud적용 완료.
$("input[type='file']").change(function () {
    // 수정인경우 filename필드에 파일이름을 바꿔줘야함 
    var $currFile = $(this);
    var fileTagName = $currFile.attr('name');
    if (fileTagName.startsWith('RUD')) {
        // target = intro or ending 
        var target = fileTagName.substring(3, fileTagName.length);
        var $fileNameArea = $("input[name='RUD" + target + "']").parent().find(".RUDfileName");
        var uploadedName = $(this).val();
        $fileNameArea.val(uploadedName.substring(uploadedName.lastIndexOf("\\") + 1, uploadedName.length));
        fileTagName = target;
    }

    var formData = new FormData();
    var additionalAudio = $currFile[0].files;
    if (!validateFile(additionalAudio[0].name, additionalAudio[0].size)) { // 유효성검사
        $(this).val("");
        return false;
    }

    formData.append("additionalAudio", additionalAudio[0]);

    $.ajax({
        url: 'http://localhost:8080/rbcboard/fileUpload',
        processData: false,
        contentType: false,
        data: formData,
        type: 'POST',
        dataType: 'json',
        success: function (result) {
            $("#" + fileTagName + "Player").attr('src', "http://localhost:8080/rbcboard/" + result[0])
            makeCancelBtn($currFile);
        }
    });
});

// ===============================================================================
// 미리듣기 버튼 이벤트
// 수정이 제대로 된것일까.
$(".preListen").on("click", function (e) {
    e.preventDefault();
    $(this).parent().parent().find(".submitBtn").prop("disabled", false);

    var $targetForm = $(this).parent().parent().parent().parent();
    console.log($targetForm);

    // 수정창이라면
    // 1.파일첨부 변경 안되었으면 기존 파일 가져다가 audio셋팅시켜줘야함
    // -> 등록할때도 같으니 function으로 빼자 


    // 수정일 경우에 
    if (($targetForm).attr('id') === "rudFormTable") {
        // set하기전에 palyer들 셋팅이 되어야함. 

        // case 1) if player세팅이 안되어있고 & 기존파일이 있다면? 
        // => 기존파일을 유지시킨다.(player src셋팅)

        // case 2) if player 셋팅이 되어있다면? 
        // => 수정시 덮어쓰는 경우 혹은
        // 기존 파일이 없었는데 신규등록하는 경우이므로
        // 그냥 셋팅된 값으로 재생시킨다. 

        // case 3) if 기존파일이 있는데 그걸 삭제한다면?
        // (기존파일 삭제하는 버튼 만들어야함) > 이거 파일 삭제 버튼으로 대체할것
        // 내용이 있으면 버튼을 무조건 생성시킬것. 
        // => 이경우 기존파일 path(RUDoriginalIntro)를 같이
        // 날려주면 되므로(파일삭제 버튼에 기능추가) 
        // case 4와 같은 경우로 취급한다.  

        // case 4) if player셋팅이 안되어있고, 기존파일도 없다면
        // => 그냥 없는 경우이므로 무시한다.

        // case 1,3,4
        // intro의 경우 (이거 intro ending합치는법 고민해볼것 )
        var $introPlayer = $("#introPlayer")
        var $RUDoriginalIntro = $("#RUDoriginalIntro");
        var $RUDintroFileName = $("#RUDintroFileName").val();
        var originalFileNameInPath = $RUDoriginalIntro.val();
        if ($introPlayer.attr('src') == "") {
            // player 셋팅이 안되어있는데 기존파일이 있다면(+RUDfileName value에 기존파일명이 있다면)?
            // = (+삭제버튼이 눌려진 상태가 아니라 그대로인 상태라면 )
            // player src를 기존파일경로로 셋팅시킨다. (contoller/{uploadpath}로 들어감.)
            if ((originalFileNameInPath !== "") &&
                ($RUDintroFileName == originalFileNameInPath.substring(originalFileNameInPath.lastIndexOf("_") + 1, originalFileNameInPath.length))) {
                $introPlayer.attr('src', "http://localhost:8080/rbcboard/" + originalFileNameInPath);
            }
            // 기존 파일이 없다면? 
            else {
                // 무시, 나중에 필요하면 적자. 필요없으면 if문 &로 합치고 지우자 
            }
        } // end of player 셋팅이 안되어있는 경우 

        // player 셋팅이 되어있는 경우 (case2)
        else {
            // 무시, 그냥 그 player를 재생시키면 되므로. 나중에 필요하면 적자. 
        }

        // ending의 경우 
        var $endingPlayer = $("#endingPlayer")
        var $RUDoriginalEnding = $("#RUDoriginalEnding");
        var $RUDendingFileName = $("#RUDendingFileName").val();
        originalFileNameInPath = $RUDoriginalEnding.val();
        if ((originalFileNameInPath !== "") &&
            ($RUDendingFileName == originalFileNameInPath.substring(originalFileNameInPath.lastIndexOf("_") + 1, originalFileNameInPath.length))) {
            console.log("기존파일이 있고, 이후에 삭제되지 않았고, 추가로 덮어쓴 파일이 없다면 이게 실행되어야함");
            console.log("그리고 미리듣기시 재생이 되어야함")
            $endingPlayer.attr('src', "http://localhost:8080/rbcboard/" + originalFileNameInPath);
        }

    } // end of RUD condition

    setAllElements($targetForm);
    jsonData = {
        title: title,
        content: content,
        gender: gender
    };
    $.ajax({
        url: 'http://localhost:8080/rbcboard/prelisten',
        data: jsonData,
        type: 'GET',
        dataType: 'json',
        contentType: "application/json; charset=utf-8",
        async: false,
        success: function (result) {
            $("#sourcePlayer").attr('src', "http://localhost:8080/rbcboard/" + result[0]);
            setAudioElements();
            playAllAudios(audioObjects, 0);
        } // end of success function
    });  // end of ajax
    $(this).parent().parent().find(".submitBtn").css("color", "");
}); //end of preListen button event


// ===============================================================================
// 저장버튼 클릭 이벤트
$("#submitBtn").on("click", function (e) {
    e.preventDefault();
    var $targetForm = $(this).parent().parent().parent();
    setAllElements($targetForm);
    var result;
    var isUrgent = 0;

    

    if ($(".urgentCheck").is(":checked")) {
        result = confirm("확인 버튼을 누르면 곧바로 방송이 송출됩니다. 정말 등록하시겠습니까?");
        if (!result) {
            return; // confirm창에서 취소버튼을 누른경우.
        } else { // 긴급공지
            // 메서드로 뺼 수 있나 고민해볼것
            var uToday = new Date();
            var uDay = ((uToday.getDate()).toString().length == 1 ? "0" + (uToday.getDate()) : (uToday.getDate()));
            var uMonth = ((uToday.getMonth() + 1).toString().length == 1 ? "0" + (uToday.getMonth() + 1) : (uToday.getMonth() + 1));
            var uHour = uToday.getHours().toString().length == 1 ? "0" + uToday.getHours() : uToday.getHours();
            var uMinute = uToday.getMinutes().toString().length == 1 ? "0" + uToday.getMinutes() : uToday.getMinutes();
            startdate = uToday.getFullYear() + "-" + uMonth + "-" + uDay;
            starttime = uHour + ":" + uMinute;

            var intro = "";
            var ending = "";

            // if intro exists
            if ($("#introPlayer").attr('src') !== "") {
                intro = checkadditionalAudioExist($("input[name='intro']")[0].files);
            }
            // if ending exists
            if ($("#endingPlayer").attr('src') !== "") {
                ending = checkadditionalAudioExist($("input[name='ending']")[0].files);
            }
            // return으로 파일명(with UUID)받아서 jsonData로는 only 파일명만 세팅해주기
            jsonData = {
                content: content,
                title: title,
                gender: gender,
                'mid': getCookie("userName"),
                startdate: startdate,
                starttime: starttime,
                audioVO: { alarmBell: alarmBell, intro: intro, ending: ending }
            };

            isUrgent = 1;
            setAudioElements();
            playAllAudios(audioObjects, isUrgent);
        }
    } else { // 긴급방송이 아닌경우 
        var ymdSet = $("#ymdSet")[0];
        var timeSet = $("#timeSet")[0];
        if (($("#repeat").val() == "" && ymdSet.value == "") || (timeSet.value == "")) {
            alert("방송 일자와 시간을 설정해주세요.")
            return;
        }
        result = confirm("방송을 등록하시겠습니까?");
        if (!result) {
            return;
        } else {
            startdate = ymdSet.value;
            starttime = timeSet.value;
            var repeatSet = $("#repeat").val();
            var intro = "";
            var ending = "";
            if ($("#introPlayer").attr('src') !== "") {
                intro = checkadditionalAudioExist($("input[name='intro']")[0].files);
            } // end of if intro exists
            if ($("#endingPlayer").attr('src') !== "") {
                ending = checkadditionalAudioExist($("input[name='ending']")[0].files);
            } // end of if ending exists

            if (repeatSet.startsWith("week")) {
                jsonData = getBCBoard(content, title, gender, starttime, alarmBell, intro, ending, repeatSet)
                /* jsonData = {
                    content: content,
                    title: title,
                    gender: gender,
                    starttime: starttime,
                    audioVO: { alarmBell: alarmBell, intro: intro, ending: ending },
                    repeatVO: { repeatWeek: repeatSet }
                }; */
            } else if (repeatSet.startsWith("month")) {
                jsonData = {
                    content: content,
                    title: title,
                    gender: gender,
                    'mid': getCookie("userName"),
                    starttime: starttime,
                    audioVO: { alarmBell: alarmBell, intro: intro, ending: ending },
                    repeatVO: { repeatMonth: repeatSet }
                };
            } else {
                jsonData = {
                    content: content,
                    title: title,
                    gender: gender,
                    'mid': getCookie("userName"),
                    startdate: startdate,
                    starttime: starttime,
                    audioVO: { alarmBell: alarmBell, intro: intro, ending: ending }
                };
            }

        }
    } // end of else(긴급방송이 아닌경우)

    $.ajax({
        url: 'http://localhost:8080/rbcboard/register',
        data: JSON.stringify(jsonData),
        type: 'POST',
        contentType: "application/json; charset=utf-8"
    }).done(function (data) {
        /* getTodayList();
        $("#todayListBtn").trigger('click'); */
        if (isUrgent == 0) {
            location.reload();
        } // 새로고침은 어쩔수 없음. 더이상 생각하지 말자
    }) // end of ajax
}); // end of submitbutton event

$("#repeatType").on("change", function () {
    var target = $(this);

    $("#repeatWeekdiv").css("display", "none")
    $("#repeatMonthdiv").css("display", "none")
    $("input:checkbox[name='repeatWeek']:checked").each(function () {


        $(this).attr('checked', false);
    });
    $("#" + target.val() + "div").css("display", "")
})

$("#repeatSubmitBtn").on("click", function () {
    var str = ''
    var ymdSet = $("#ymdSet")

    if ($("#repeatType").val() === "repeatWeek") {
        str = "week-"
        $("input:checkbox[name='repeatWeek']:checked").each(function () {
            str += $(this).data("val") + ","
        });
        if (str === "week-") {
            $("#repeat").val("")
            $("#repeatView").val("")
            ymdSet.attr("disabled", false);
            ymdSet.css("background-color", "")
            return;
        }
    } else {
        str = "month-"
        str += $("#repeatMonth").val()
        if (str === "month-") {
            $("#repeat").val("")
            $("#repeatView").val("")
            ymdSet.attr("disabled", false);
            ymdSet.css("background-color", "")
            return;
        }

    }

    if ($("#repeatType").val() === "repeatWeek") {
        var weeks = [" 일", " 월", " 화", " 수", " 목", " 금", " 토"]
        $("#repeat").val(str)
        str = str.replace("week-", "매 주 ")
        for (let index = 0; index < weeks.length; index++) {
            if (index ==weeks.length ) {
                str = str.replace(index+",",weeks[index])
            }else{
                str = str.replace(index,weeks[index])
            }
        }
        $("#repeatView").val((str+"요일").replace(",요일", "요일"))
    }else{
        $("#repeat").val(str)
        str = str.replace("month-","매 월 ")
        $("#repeatView").val(str+"일")
    }

    ymdSet.attr("disabled", true);
    ymdSet.val("")
    ymdSet.css("background-color", "lightgray")

})

function repeatMonthSelectAppend() {
    var str = '<option selected value="">월간반복</option>';
    for (let index = 1; index < 32; index++) {
        str += '<option value="' + index + '">매월 ' + index + '일</option>'
    }
    $("#repeatMonth").html(str)
}

// function registerTest() {
//     $("#title").val("테스트입니둥")
//     $("#content").val("테스트 내용임둥")
//     $("#voiceGender").val("테스트 내용임둥")
//     $("#voiceGender").val("man")
//     $("#ymdSet").val(new Date().getFullYear() + "-" + (new Date().getMonth() + 1) + "-" + new Date().getDate())
//     $("#timeSet").val(new Date().getHours() + ":" + (new Date().getMinutes() + 1))
// }

function getBCBoard(content, title, gender, starttime, alarmBell, intro, ending, repeatSet) {
    let result = {
        'content': content,
        'title': title,
        'gender': gender,
        'starttime': starttime,
        'audioVO': { 'alarmBell': alarmBell, 'intro': intro, 'ending': ending },
        'repeatVO': { 'repeatWeek': repeatSet }
    };
    return result;
}


var getCookie = function (name) {
	var value = document.cookie.match('(^|;) ?' + name + '=([^;]*)(;|$)');
	return value ? value[2] : null;
 };
exports.pager = function(nowPage, totalCnt, perPageNum, perChapterNum) { //js모듈을 외부로 뽑아 쓸수 있게해줌.
    this.endPage = Math.ceil(nowPage / perChapterNum ) * perChapterNum; //끝 페이지
    this.startPage = this.endPage - perChapterNum + 1; //시작페이지
    this.totalPage = Math.ceil(totalCnt / perChapterNum); //총 페이지 수
    this.nowPage = nowPage;

    //이전 챕터로 가는 버튼 
    if(this.startPage != 1) {
        this.before = true;
    } else {
        this.before = false;
    }

    //다음 챕터로 가는 버튼
    this.next = true;
    if(this.totalPage <= this.endPage) {
        this.endPage == this.totalPage;
        this.next = false;
    }

    return this;
}
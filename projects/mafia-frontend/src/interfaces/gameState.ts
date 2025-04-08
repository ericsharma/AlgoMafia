export enum GameState {
  JoinGameLobby = 0,
  AssignRole = JoinGameLobby + 1,
  DayStageVote = AssignRole + 1,
  DayStageEliminate = DayStageVote + 1,
  DayStageUnmasking = DayStageEliminate + 1,
  NightStageMafiaCommit = DayStageUnmasking + 1,
  NightStageDoctorCommit = NightStageMafiaCommit + 1,
  DawnStageMafiaReveal = NightStageDoctorCommit + 1,
  DawnStageDoctorReveal = DawnStageMafiaReveal + 1,
  DawnStageDeadOrSaved = DawnStageDoctorReveal + 1,
  DawnStageUnmasking = DawnStageDeadOrSaved + 1,
  GameOver = DawnStageUnmasking + 1,
}

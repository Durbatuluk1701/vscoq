(**************************************************************************)
(*                                                                        *)
(*                                 VSCoq                                  *)
(*                                                                        *)
(*                   Copyright INRIA and contributors                     *)
(*       (see version control and README file for authors & dates)        *)
(*                                                                        *)
(**************************************************************************)
(*                                                                        *)
(*   This file is distributed under the terms of the MIT License.         *)
(*   See LICENSE file.                                                    *)
(*                                                                        *)
(**************************************************************************)

open Printing

open Ppx_yojson_conv_lib.Yojson_conv.Primitives

type goal = {
  id: int;
  hypotheses: pp list;
  goal: pp;
  elidedTerms : (string * pp) list; (* lazy map *)
} [@@deriving yojson]

type minifiedGoal = {
  id: int;
  hypotheses: pp list;
  goal: pp;
} [@@deriving yojson]

type minifiedT = {
  goals: minifiedGoal list;
  shelvedGoals: minifiedGoal list;
  givenUpGoals: minifiedGoal list;
  unfocusedGoals: minifiedGoal list;
} [@@deriving yojson]

type t = {
  goals: goal list;
  shelvedGoals: goal list;
  givenUpGoals: goal list;
  unfocusedGoals: goal list;
} [@@deriving yojson]

let minify_proof (proof: t) : minifiedT =
  let minify_goal (goal: goal) : minifiedGoal =
    {
      id = goal.id;
      hypotheses = goal.hypotheses;
      goal = goal.goal;
    }
  in
  {
    goals = List.map minify_goal proof.goals;
    shelvedGoals = List.map minify_goal proof.shelvedGoals;
    givenUpGoals = List.map minify_goal proof.givenUpGoals;
    unfocusedGoals = List.map minify_goal proof.unfocusedGoals;
  }

open Printer
module CompactedDecl = Context.Compacted.Declaration

let mk_goal env sigma g maxDepth =
  let EvarInfo evi = Evd.find sigma g in
  let env = Evd.evar_filtered_env env evi in
  let min_env = Environ.reset_context env in
  let id = Evar.repr g in
  let concl = match Evd.evar_body evi with
  | Evar_empty -> Evd.evar_concl evi
  | Evar_defined body -> Retyping.get_type_of env sigma body
  in
  let ccl =
    pr_letype_env ~goal_concl_style:true env sigma concl
  in
  let mk_hyp d (env,l) =
    let d' = CompactedDecl.to_named_context d in
    let env' = List.fold_right EConstr.push_named d' env in
    let hyp = pr_ecompacted_decl env sigma d in
    (env', hyp :: l)
  in
  let (_env, hyps) =
    Context.Compacted.fold mk_hyp
      (Termops.compact_named_context sigma (EConstr.named_context env)) ~init:(min_env,[]) in
  let pp, map = pp_of_coqpp_with_depth ccl maxDepth in
  let acc = List.rev_map (fun h -> pp_of_coqpp_with_depth h maxDepth) hyps in
  let hyps, hyp_map = List.fold_left (fun (acc, map) (pp, m) -> (pp :: acc, m @ map)) ([], []) acc in
  {
    id;
    hypotheses = hyps;
    goal = pp;
    elidedTerms = map @ hyp_map;
  }
  (* {
    id;
    hypotheses = List.rev_map (fun h -> fst (pp_of_coqpp_with_depth h 0)) hyps;
    goal = pp;
    elidedTerms = map;
  }
  {
    id;
    hypotheses = List.rev_map pp_of_coqpp hyps;
    goal = pp_of_coqpp ccl;
  }
  let hyps = List.rev_map (fun h -> fst (pp_of_coqpp_with_depth h maxDepth)) hyps in
  {
    id;
    hypotheses = hyps;
    goal = pp;
    elidedTerms = map;
  }
  {
    id;
    hypotheses = List.rev_map (fun h -> fst (pp_of_coqpp_with_depth h 0)) hyps;
    goal = pp;
    elidedTerms = map;
  }
  {
    id;
    hypotheses = List.rev_map pp_of_coqpp hyps;
    goal = pp_of_coqpp ccl;
  } *)

let mk_goal_diff diff_goal_map env sigma g maxDepth =
  let id = Evar.repr g in
  let og_s = Proof_diffs.map_goal g diff_goal_map in
  let (hyps, ccl) = Proof_diffs.diff_goal ?og_s (Proof_diffs.make_goal env sigma g) in
  let pp, map = pp_of_coqpp_with_depth ccl maxDepth in
  let acc = List.rev_map (fun h -> pp_of_coqpp_with_depth h maxDepth) hyps in
  let hyps, hyp_map = List.fold_left (fun (acc, map) (pp, m) -> (pp :: acc, m @ map)) ([], []) acc in

  {
    id;
    hypotheses = hyps;
    goal = pp;
    elidedTerms = map @ hyp_map;
  }

let proof_of_state st =
  match st.Vernacstate.interp.lemmas with
  | None -> None
  | Some lemmas ->
    Some (lemmas |> Vernacstate.LemmaStack.with_top ~f:Declare.Proof.get)

(* The Coq diff API is so poorly designed that we have to imperatively set a
   string option to control the behavior of `mk_goal_diff`. We do the required
   plumbing here. *)
let string_of_diff_mode = function
  | Settings.Goals.Diff.Mode.Off -> "off"
  | On -> "on"
  | Removed -> "removed"

let set_diff_mode diff_mode =
  Goptions.set_string_option_value Proof_diffs.opt_name @@ string_of_diff_mode diff_mode

let get_proof ~previous diff_mode st maxDepth =
  Vernacstate.unfreeze_full_state st;
  match proof_of_state st with
  | None -> None
  | Some proof ->
    let mk_goal env sigma g =
      match diff_mode with
      | Settings.Goals.Diff.Mode.Off ->
        mk_goal env sigma g maxDepth
      | _ ->
        begin
          set_diff_mode diff_mode;
          match Option.bind previous proof_of_state with
          | None -> mk_goal env sigma g maxDepth
          | Some old_proof ->
            let diff_goal_map = Proof_diffs.make_goal_map old_proof proof in
            mk_goal_diff diff_goal_map env sigma g maxDepth
        end
    in
    let env = Global.env () in
    let proof_data = Proof.data proof in
    let b_goals = Proof.background_subgoals proof in
    let sigma = proof_data.sigma in
    let mapper = List.map (mk_goal env sigma) in
    let goals = mapper proof_data.goals in
    let unfocusedGoals = mapper b_goals in
    let shelvedGoals = mapper (Evd.shelf sigma) in
    let givenUpGoals = mapper (Evar.Set.elements @@ Evd.given_up sigma) in
    Some {
      goals;
      shelvedGoals;
      givenUpGoals;
      unfocusedGoals;
    }
